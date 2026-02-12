import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import Billing from '@/backend/models/billing.model';
import DriverSalary from '@/backend/models/driver-salary.model';
import User from '@/backend/models/user.model';
import type { IDriverPerformance } from '@/backend/types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Force dynamic rendering (uses getServerSession which requires headers)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports/drivers
 * Get driver performance report
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
    const driverId = searchParams.get('driverId');
    const monthsBack = parseInt(searchParams.get('monthsBack') || '12');

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (!driverId) {
      return NextResponse.json(
        { success: false, message: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Get driver details
    const driver = await User.findById(driverId).lean();

    if (!driver || driver.role !== 'driver') {
      return NextResponse.json(
        { success: false, message: 'Driver not found' },
        { status: 404 }
      );
    }

    // Collect monthly data
    const monthlyData = [];
    let totalTrips = 0;
    let totalKms = 0;
    let totalRevenue = 0;
    let totalSalary = 0;
    let totalBonus = 0;

    for (let i = monthsBack - 1; i >= 0; i--) {
      const month = currentMonth - i;
      let year = currentYear;
      let adjustedMonth = month;

      if (month <= 0) {
        adjustedMonth = 12 + month;
        year = currentYear - 1;
      }

      // Get tripsheets for this driver and month
      const trips = await Tripsheet.find({
        driverId,
        month: adjustedMonth,
        year,
        status: 'approved',
      }).populate('vehicleId').lean();

      const monthTrips = trips.length;
      const monthKms = trips.reduce((sum, t) => sum + (t.summary.totalKms || 0), 0);

      // Get revenue from billings (match by vehicle)
      let monthRevenue = 0;
      for (const trip of trips) {
        const vehicle = trip.vehicleId as any;
        const billings = await Billing.find({
          vehicleId: vehicle._id,
          month: adjustedMonth,
          year,
        }).lean();

        monthRevenue += billings.reduce((sum, b) => sum + b.calculation.totalAmount, 0);
      }

      // Get salary data
      const salaryData = await DriverSalary.findOne({
        driverId,
        month: adjustedMonth,
        year,
      }).lean();

      const monthSalary = salaryData ? salaryData.basicSalary + (salaryData.additionalPay || 0) : 0;
      const monthBonus = salaryData ? (salaryData.bonus || 0) : 0;

      monthlyData.push({
        month: `${MONTH_NAMES[adjustedMonth - 1]} ${year}`,
        trips: monthTrips,
        kms: monthKms,
        revenue: monthRevenue,
        salary: monthSalary,
        bonus: monthBonus,
      });

      totalTrips += monthTrips;
      totalKms += monthKms;
      totalRevenue += monthRevenue;
      totalSalary += monthSalary;
      totalBonus += monthBonus;
    }

    const performance: IDriverPerformance = {
      driverId: driver._id.toString(),
      driverName: driver.name,
      monthlyData,
      totalStats: {
        totalTrips,
        totalKms,
        totalRevenue,
        totalSalary,
        totalBonus,
        averageRating: 4.5, // Placeholder - implement rating system later
      },
    };

    return NextResponse.json({
      success: true,
      data: performance,
    });
  } catch (error: any) {
    console.error('Driver report error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate driver report',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
