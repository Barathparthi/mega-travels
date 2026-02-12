import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import Billing from '@/backend/models/billing.model';
import DriverSalary from '@/backend/models/driver-salary.model';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import type {
  IMonthlyReport,
  IMonthlyReportStats,
  IVehicleTypeBreakdown,
  IMonthlyTrend,
  VehicleTypeCode,
} from '@/backend/types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Force dynamic rendering (uses getServerSession which requires headers)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports/monthly
 * Get comprehensive monthly report with analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const monthsBack = parseInt(searchParams.get('monthsBack') || '6');

    // Get billings for the current month
    const billings = await Billing.find({ month, year }).lean();

    // Get fuel expenses and tripsheets
    const tripsheets = await Tripsheet.find({
      month,
      year,
      status: 'approved',
    })
    .populate('vehicleId', 'vehicleTypeId')
    .populate('driverId')
    .lean();

    // Calculate total revenue from all approved tripsheets (not just bills)
    // This ensures revenue is shown even if bills aren't generated yet
    let totalRevenue = 0;
    if (tripsheets.length > 0) {
      // Get all unique vehicle type names
      const vehicleTypeNames = new Set<string>();
      tripsheets.forEach((trip: any) => {
        const vehicle = trip.vehicleId;
        if (vehicle && vehicle.vehicleTypeId && typeof vehicle.vehicleTypeId === 'string') {
          vehicleTypeNames.add(vehicle.vehicleTypeId);
        }
      });

      if (vehicleTypeNames.size > 0) {
        // Fetch all vehicle types at once
        const allVehicleTypes = await VehicleType.find({
          name: { $in: Array.from(vehicleTypeNames) }
        }).select('name code billingRules').lean();
        
        if (allVehicleTypes.length === 0) {
          console.warn(`No vehicle types found for names: ${Array.from(vehicleTypeNames).join(', ')}`);
        }
        
        const vehicleTypeMap = new Map(allVehicleTypes.map((vt: any) => [vt.name, vt]));

        // Import billing calculator
        const { calculateBilling } = await import('@/lib/utils/billing-calculator');

        // Calculate revenue for each tripsheet
        for (const tripsheet of tripsheets) {
          const vehicle: any = tripsheet.vehicleId;
          if (vehicle && vehicle.vehicleTypeId) {
            const vehicleType = vehicleTypeMap.get(vehicle.vehicleTypeId);
            if (vehicleType && vehicleType.billingRules) {
              try {
                const billingCalculation = calculateBilling(tripsheet as any, vehicleType);
                totalRevenue += billingCalculation.totalAmount || 0;
              } catch (error) {
                console.error(`Error calculating billing for tripsheet ${tripsheet._id}:`, error);
              }
            } else {
              console.warn(`Vehicle type not found or missing billing rules for: ${vehicle.vehicleTypeId}`);
            }
          }
        }
      }
    }
    
    // Log for debugging
    console.log(`Monthly Report - Month: ${month}, Year: ${year}, Total Revenue: ${totalRevenue}, Tripsheets: ${tripsheets.length}`);

    const totalFuelCost = tripsheets.reduce(
      (sum, t) => sum + (t.summary.totalFuelAmount || 0),
      0
    );

    const totalKms = tripsheets.reduce((sum, t) => sum + (t.summary.totalKms || 0), 0);

    // Get salaries
    const salaries = await DriverSalary.find({ month, year }).lean();
    const totalSalaries = salaries.reduce(
      (sum, s) => sum + s.totalAmount,
      0
    );

    // Calculate stats
    const totalExpenses = totalFuelCost + totalSalaries;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const stats: IMonthlyReportStats = {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalTrips: tripsheets.length,
      totalKms,
      totalFuelCost,
      totalSalaries,
      averageRevenuePerTrip: tripsheets.length > 0 ? totalRevenue / tripsheets.length : 0,
      profitMargin,
    };

    // Vehicle Type Breakdown
    const vehicleTypeMap = new Map<string, {
      type: string;
      code: VehicleTypeCode;
      trips: number;
      kms: number;
      revenue: number;
      fuel: number;
    }>();

    // Get all unique vehicle type names first
    const vehicleTypeNames = new Set<string>();
    tripsheets.forEach((trip: any) => {
      const vehicle = trip.vehicleId;
      if (vehicle && vehicle.vehicleTypeId && typeof vehicle.vehicleTypeId === 'string') {
        vehicleTypeNames.add(vehicle.vehicleTypeId);
      }
    });

    // Fetch all vehicle types at once
    const allVehicleTypes = await VehicleType.find({
      name: { $in: Array.from(vehicleTypeNames) }
    }).select('name code').lean();
    const vehicleTypeNameMap = new Map(allVehicleTypes.map((vt: any) => [vt.name, vt]));

    for (const trip of tripsheets) {
      const vehicle = trip.vehicleId as any;
      const vehicleTypeName = vehicle.vehicleTypeId;

      const vehicleType = vehicleTypeNameMap.get(vehicleTypeName);
      if (!vehicleType) continue;

      const key = vehicleType.code;
      if (!vehicleTypeMap.has(key)) {
        vehicleTypeMap.set(key, {
          type: vehicleType.name,
          code: vehicleType.code as VehicleTypeCode,
          trips: 0,
          kms: 0,
          revenue: 0,
          fuel: 0,
        });
      }

      const data = vehicleTypeMap.get(key)!;
      data.trips += 1;
      data.kms += trip.summary.totalKms || 0;
      data.fuel += trip.summary.totalFuelAmount || 0;
    }

    // Add revenue data from billings
    // Fetch vehicle types for billings (billing.vehicleTypeId is ObjectId, not string)
    const billingVehicleTypeIds = [...new Set(billings.map((b: any) => b.vehicleTypeId?.toString()).filter(Boolean))];
    const billingVehicleTypes = await VehicleType.find({
      _id: { $in: billingVehicleTypeIds }
    }).select('code').lean();
    const billingVehicleTypeMap = new Map(billingVehicleTypes.map((vt: any) => [vt._id.toString(), vt]));

    for (const billing of billings) {
      const vehicleType = billingVehicleTypeMap.get(billing.vehicleTypeId?.toString());
      if (!vehicleType) continue;

      const key = vehicleType.code;
      if (vehicleTypeMap.has(key)) {
        vehicleTypeMap.get(key)!.revenue += billing.calculation.totalAmount;
      }
    }

    const vehicleTypeBreakdown: IVehicleTypeBreakdown[] = Array.from(vehicleTypeMap.values()).map(data => ({
      vehicleType: data.type,
      vehicleTypeCode: data.code,
      tripCount: data.trips,
      totalKms: data.kms,
      revenue: data.revenue,
      fuelCost: data.fuel,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }));

    // Monthly Trends (last N months)
    const monthlyTrends: IMonthlyTrend[] = [];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const trendMonth = month - i;
      let trendYear = year;

      let adjustedMonth = trendMonth;
      if (trendMonth <= 0) {
        adjustedMonth = 12 + trendMonth;
        trendYear = year - 1;
      }

      const monthBillings = await Billing.find({
        month: adjustedMonth,
        year: trendYear,
      }).lean();

      const monthTrips = await Tripsheet.find({
        month: adjustedMonth,
        year: trendYear,
        status: 'approved',
      }).lean();

      const monthSalaries = await DriverSalary.find({
        month: adjustedMonth,
        year: trendYear,
      }).lean();

      const revenue = monthBillings.reduce((sum, b) => sum + b.calculation.totalAmount, 0);
      const fuelCost = monthTrips.reduce((sum, t) => sum + (t.summary.totalFuelAmount || 0), 0);
      const salaries = monthSalaries.reduce((sum, s) => sum + s.totalAmount, 0);
      const expenses = fuelCost + salaries;

      monthlyTrends.push({
        month: `${MONTH_NAMES[adjustedMonth - 1]} ${trendYear}`,
        revenue,
        expenses,
        profit: revenue - expenses,
        trips: monthTrips.length,
      });
    }

    // Top Vehicles
    const vehicleRevenue = new Map<string, { number: string; revenue: number; trips: number; kms: number }>();

    for (const billing of billings) {
      const vehicle = await Vehicle.findById(billing.vehicleId).lean();
      if (!vehicle) continue;

      const key = vehicle._id.toString();
      if (!vehicleRevenue.has(key)) {
        vehicleRevenue.set(key, {
          number: vehicle.vehicleNumber,
          revenue: 0,
          trips: 0,
          kms: 0,
        });
      }

      vehicleRevenue.get(key)!.revenue += billing.calculation.totalAmount;
    }

    for (const trip of tripsheets) {
      const vehicle = trip.vehicleId as any;
      const key = vehicle._id.toString();

      if (vehicleRevenue.has(key)) {
        vehicleRevenue.get(key)!.trips += 1;
        vehicleRevenue.get(key)!.kms += trip.summary.totalKms || 0;
      }
    }

    const topVehicles = Array.from(vehicleRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(v => ({
        vehicleNumber: v.number,
        revenue: v.revenue,
        trips: v.trips,
        kms: v.kms,
      }));

    // Top Drivers
    const driverMap = new Map<string, { name: string; trips: number; revenue: number }>();

    for (const trip of tripsheets) {
      const driver = trip.driverId as any;
      const key = driver._id.toString();

      if (!driverMap.has(key)) {
        driverMap.set(key, {
          name: driver.name,
          trips: 0,
          revenue: 0,
        });
      }

      driverMap.get(key)!.trips += 1;
    }

    // Match trips with billings to get revenue per driver
    for (const billing of billings) {
      const relatedTrips = tripsheets.filter(t => {
        const vehicle = t.vehicleId as any;
        return vehicle._id.toString() === billing.vehicleId.toString();
      });

      for (const trip of relatedTrips) {
        const driver = trip.driverId as any;
        const key = driver._id.toString();
        if (driverMap.has(key)) {
          driverMap.get(key)!.revenue += billing.calculation.totalAmount / relatedTrips.length;
        }
      }
    }

    const topDrivers = Array.from(driverMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(d => ({
        driverName: d.name,
        trips: d.trips,
        revenue: d.revenue,
      }));

    const report: IMonthlyReport = {
      stats,
      vehicleTypeBreakdown,
      monthlyTrends,
      topVehicles,
      topDrivers,
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Monthly report error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate monthly report',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
