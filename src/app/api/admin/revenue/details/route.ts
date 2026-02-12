import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import DriverSalary from '@/backend/models/driver-salary.model';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import VehicleLoan from '@/backend/models/vehicle-loan.model';
import { calculateBilling } from '@/lib/utils/billing-calculator';
import { calculateDriverSalary } from '@/backend/utils/salary-calculator';
import { TripsheetStatus } from '@/backend/types';

/**
 * GET /api/admin/revenue/details
 * Get detailed revenue breakdown per vehicle with tripsheet-level details
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

    // Get all vehicle types upfront for quick lookup
    // Map by both _id and name since vehicleTypeId might be stored as either
    const vehicleTypes = await VehicleType.find({ isActive: true }).lean();
    const vehicleTypeMap = new Map<string, any>();
    vehicleTypes.forEach((vt: any) => {
      vehicleTypeMap.set(vt._id.toString(), vt);
      vehicleTypeMap.set(vt.name, vt); // Also map by name in case vehicleTypeId is stored as name
    });

    // Get all tripsheets for the month (include all statuses for now to show data)
    // Filter can be adjusted later if needed
    const tripsheets = await Tripsheet.find({
      month,
      year,
      // Include all statuses - we'll calculate revenue for any tripsheet with data
      // status: { $in: [TripsheetStatus.APPROVED, TripsheetStatus.SUBMITTED] },
    })
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber vehicleTypeId assignedDriverId',
      })
      .populate({
        path: 'driverId',
        select: 'name email phone',
      })
      .lean();

    console.log(`[Revenue Details] Found ${tripsheets.length} tripsheets for ${month}/${year}`);
    
    // Debug: Log tripsheet statuses
    if (tripsheets.length > 0) {
      const statusCounts = tripsheets.reduce((acc: any, ts: any) => {
        acc[ts.status] = (acc[ts.status] || 0) + 1;
        return acc;
      }, {});
      console.log(`[Revenue Details] Tripsheet status breakdown:`, statusCounts);
    } else {
      // Check if there are ANY tripsheets for this month/year (regardless of status)
      const allTripsheets = await Tripsheet.find({ month, year }).select('status tripsheetNumber').lean();
      console.log(`[Revenue Details] Total tripsheets for ${month}/${year} (all statuses):`, allTripsheets.length);
      if (allTripsheets.length > 0) {
        const allStatusCounts = allTripsheets.reduce((acc: any, ts: any) => {
          acc[ts.status] = (acc[ts.status] || 0) + 1;
          return acc;
        }, {});
        console.log(`[Revenue Details] All tripsheet statuses:`, allStatusCounts);
      }
    }

    // Get all bills for the month (if any exist)
    const Billing = (await import('@/backend/models/billing.model')).default;
    const billings = await Billing.find({ month, year }).lean();
    const billedTripsheetIds = new Set(billings.map(b => b.tripsheetId.toString()));

    // Get all salaries for the month
    const salaries = await DriverSalary.find({ month, year }).lean();
    const salaryByTripsheetMap = new Map<string, number>();
    for (const salary of salaries) {
      const tripsheetId = salary.tripsheetId.toString();
      salaryByTripsheetMap.set(tripsheetId, salary.calculation.totalSalary);
    }

    // Get all active vehicle loans and calculate EMI for the month
    const activeLoans = await VehicleLoan.find({ isActive: true }).lean();
    const loanEmiByVehicleMap = new Map<string, number>();
    
    for (const loan of activeLoans) {
      const vehicleId = loan.vehicleId.toString();
      
      // Check if there's a payment for this month/year
      const monthPayment = loan.payments?.find((payment: any) => {
        const paymentDate = new Date(payment.emiDate);
        return paymentDate.getMonth() + 1 === month && paymentDate.getFullYear() === year;
      });
      
      // If payment exists, use its amount; otherwise use the loan's EMI amount
      const emiAmount = monthPayment ? monthPayment.amount : loan.emiAmount;
      
      // Add to vehicle's total loan EMI (in case there are multiple loans)
      loanEmiByVehicleMap.set(vehicleId, (loanEmiByVehicleMap.get(vehicleId) || 0) + emiAmount);
    }

    // Group tripsheets by vehicle and calculate revenue for each
    const vehicleMap = new Map<string, {
      vehicleId: string;
      vehicleNumber: string;
      vehicleType?: string;
      driverName?: string;
      tripsheets: Array<{
        _id: string;
        tripsheetNumber: string;
        revenue: number;
        driverSalary: number;
        fuelExpenses: number;
        loanEmi: number;
        profit: number;
      }>;
      totalRevenue: number;
      totalDriverSalary: number;
      totalFuelExpenses: number;
      totalLoanEmi: number;
      totalProfit: number;
    }>();

    for (const tripsheet of tripsheets) {
      const vehicle = tripsheet.vehicleId as any;
      const driver = tripsheet.driverId as any;
      
      if (!vehicle || !vehicle._id) {
        console.warn(`[Revenue Details] Skipping tripsheet ${tripsheet._id} - vehicle not found`);
        continue;
      }
      
      const vehicleId = vehicle._id.toString();
      
      // Get vehicle type from map
      // vehicleTypeId is stored as String (name) in Vehicle model, not ObjectId
      const vehicleTypeName = vehicle.vehicleTypeId?.toString() || vehicle.vehicleTypeId;
      const vehicleType = vehicleTypeName ? vehicleTypeMap.get(vehicleTypeName) : null;

      // Calculate revenue (from bill if exists, otherwise from tripsheet)
      let revenue = 0;
      const tripsheetId = tripsheet._id.toString();
      
      if (billedTripsheetIds.has(tripsheetId)) {
        // Find the bill for this tripsheet
        const bill = billings.find(b => b.tripsheetId.toString() === tripsheetId);
        if (bill) {
          revenue = bill.calculation.totalAmount;
          console.log(`[Revenue Details] Using bill revenue ${revenue} for tripsheet ${tripsheetId}`);
        }
      } else if (vehicleType && vehicleType.billingRules) {
        // Calculate from tripsheet
        try {
          // Check if tripsheet has summary data
          if (!tripsheet.summary || !tripsheet.summary.totalWorkingDays) {
            console.warn(`[Revenue Details] Tripsheet ${tripsheetId} missing summary data`);
          } else {
            const calculation = calculateBilling(tripsheet as any, vehicleType);
            revenue = calculation.totalAmount;
            console.log(`[Revenue Details] Calculated revenue ${revenue} for tripsheet ${tripsheetId} (days: ${tripsheet.summary.totalWorkingDays}, kms: ${tripsheet.summary.totalKms})`);
          }
        } catch (error: any) {
          console.error(`[Revenue Details] Error calculating billing for tripsheet ${tripsheetId}:`, error.message, error.stack);
        }
      } else {
        console.warn(`[Revenue Details] Cannot calculate revenue for tripsheet ${tripsheetId} - vehicleType: ${!!vehicleType}, billingRules: ${!!(vehicleType?.billingRules)}`);
      }

      // Get fuel expenses
      const fuelExpenses = tripsheet.summary?.totalFuelAmount || 0;
      console.log(`[Revenue Details] Fuel expenses for tripsheet ${tripsheetId}: ${fuelExpenses}`);

      // Get driver salary for this specific tripsheet
      // First check if salary exists in database, otherwise calculate from tripsheet
      let driverSalary = salaryByTripsheetMap.get(tripsheetId) || 0;
      
      // If no salary record exists, calculate it from tripsheet summary
      if (driverSalary === 0 && tripsheet.summary) {
        try {
          const salaryCalculation = calculateDriverSalary(tripsheet.summary);
          driverSalary = salaryCalculation.totalSalary;
          console.log(`[Revenue Details] Calculated driver salary ${driverSalary} for tripsheet ${tripsheetId} (days: ${tripsheet.summary.totalWorkingDays}, extraHours: ${tripsheet.summary.totalDriverExtraHours})`);
        } catch (error: any) {
          console.error(`[Revenue Details] Error calculating salary for tripsheet ${tripsheetId}:`, error.message);
        }
      } else if (driverSalary > 0) {
        console.log(`[Revenue Details] Using existing salary ${driverSalary} for tripsheet ${tripsheetId}`);
      }

      // Get loan EMI for this vehicle (monthly expense, not per tripsheet)
      // We'll distribute it across tripsheets proportionally or add it once per vehicle
      const loanEmi = 0; // Will be added at vehicle level, not tripsheet level

      // Calculate profit (without loan EMI here, will be added at vehicle level)
      const profit = revenue - driverSalary - fuelExpenses;

      if (!vehicleMap.has(vehicleId)) {
        // Get loan EMI for this vehicle
        const vehicleLoanEmi = loanEmiByVehicleMap.get(vehicleId) || 0;
        
        vehicleMap.set(vehicleId, {
          vehicleId,
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicleType?.name,
          driverName: driver?.name,
          tripsheets: [],
          totalRevenue: 0,
          totalDriverSalary: 0,
          totalFuelExpenses: 0,
          totalLoanEmi: vehicleLoanEmi,
          totalProfit: 0,
        });
      }

      const vehicleData = vehicleMap.get(vehicleId)!;
      vehicleData.tripsheets.push({
        _id: tripsheetId,
        tripsheetNumber: tripsheet.tripsheetNumber || '',
        revenue,
        driverSalary,
        fuelExpenses,
        loanEmi: 0, // Loan EMI is at vehicle level, not tripsheet level
        profit,
      });

      vehicleData.totalRevenue += revenue;
      vehicleData.totalDriverSalary += driverSalary;
      vehicleData.totalFuelExpenses += fuelExpenses;
      // Loan EMI is already set when creating vehicle entry
      
      // Recalculate profit with loan EMI at vehicle level
      vehicleData.totalProfit = vehicleData.totalRevenue - vehicleData.totalDriverSalary - vehicleData.totalFuelExpenses - vehicleData.totalLoanEmi;
    }

    // Convert to array and sort by total profit
    const result = Array.from(vehicleMap.values())
      .map((v) => ({
        ...v,
        tripsheets: v.tripsheets.map(ts => ({
          ...ts,
          vehicleId: { _id: v.vehicleId, vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType },
          driverId: { _id: '', name: v.driverName || '' },
          month,
          year,
        })),
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit);

    console.log(`[Revenue Details] Returning ${result.length} vehicles with revenue data`);
    if (result.length > 0) {
      console.log(`[Revenue Details] Sample vehicle data:`, JSON.stringify(result[0], null, 2));
    }

    return NextResponse.json({
      success: true,
      data: result,
      debug: {
        tripsheetsFound: tripsheets.length,
        vehiclesWithData: result.length,
        month,
        year,
      },
    });
  } catch (error: any) {
    console.error('Revenue details error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch revenue details',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

