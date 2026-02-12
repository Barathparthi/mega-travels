import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import Billing from '@/backend/models/billing.model';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import type { IVehiclePerformance } from '@/backend/types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Force dynamic rendering (uses getServerSession which requires headers)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports/vehicles
 * Get vehicle performance report
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
    const vehicleId = searchParams.get('vehicleId');
    const monthsBack = parseInt(searchParams.get('monthsBack') || '12');

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    // Get vehicle details
    const vehicle = await Vehicle.findById(vehicleId).lean();

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Manually fetch vehicle type since vehicleTypeId is a string (name), not ObjectId
    const vehicleType = await VehicleType.findOne({ name: vehicle.vehicleTypeId as string })
      .select('name code')
      .lean();

    if (!vehicleType) {
      return NextResponse.json(
        { success: false, message: 'Vehicle type not found' },
        { status: 404 }
      );
    }

    // Collect monthly data
    const monthlyData = [];
    let totalTrips = 0;
    let totalKms = 0;
    let totalRevenue = 0;
    let totalFuelCost = 0;

    for (let i = monthsBack - 1; i >= 0; i--) {
      const month = currentMonth - i;
      let year = currentYear;
      let adjustedMonth = month;

      if (month <= 0) {
        adjustedMonth = 12 + month;
        year = currentYear - 1;
      }

      // Get tripsheets for this vehicle and month
      const trips = await Tripsheet.find({
        vehicleId,
        month: adjustedMonth,
        year,
        status: 'approved',
      }).lean();

      const monthTrips = trips.length;
      const monthKms = trips.reduce((sum, t) => sum + (t.summary.totalKms || 0), 0);
      const monthFuel = trips.reduce((sum, t) => sum + (t.summary.totalFuelAmount || 0), 0);

      // Get revenue from billings
      const billings = await Billing.find({
        vehicleId,
        month: adjustedMonth,
        year,
      }).lean();

      const monthRevenue = billings.reduce((sum, b) => sum + b.calculation.totalAmount, 0);

      // Calculate utilization (assume 30 days per month, 8 hours per day)
      const totalAvailableHours = 30 * 8;
      const workedDays = trips.length; // Simplified: 1 trip = 1 day
      const utilization = totalAvailableHours > 0 ? (workedDays * 8 / totalAvailableHours) * 100 : 0;

      monthlyData.push({
        month: `${MONTH_NAMES[adjustedMonth - 1]} ${year}`,
        trips: monthTrips,
        kms: monthKms,
        revenue: monthRevenue,
        fuelCost: monthFuel,
        utilization: Math.min(utilization, 100),
      });

      totalTrips += monthTrips;
      totalKms += monthKms;
      totalRevenue += monthRevenue;
      totalFuelCost += monthFuel;
    }

    const averageUtilization = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.utilization, 0) / monthlyData.length
      : 0;

    const profitability = totalRevenue - totalFuelCost;

    const performance: IVehiclePerformance = {
      vehicleId: vehicle._id.toString(),
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicleType.name,
      monthlyData,
      totalStats: {
        totalTrips,
        totalKms,
        totalRevenue,
        totalFuelCost,
        averageUtilization,
        profitability,
      },
    };

    return NextResponse.json({
      success: true,
      data: performance,
    });
  } catch (error: any) {
    console.error('Vehicle report error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate vehicle report',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
