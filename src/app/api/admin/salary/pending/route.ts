import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import DriverSalary from '@/backend/models/driver-salary.model';
import { TripsheetStatus } from '@/backend/types';

/**
 * GET /api/admin/salary/pending
 * Get count of approved tripsheets that don't have salaries yet
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

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month')
      ? parseInt(searchParams.get('month')!)
      : new Date().getMonth() + 1;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : new Date().getFullYear();

    // Find all approved tripsheets for the month/year
    const approvedTripsheets = await Tripsheet.find({
      month,
      year,
      status: TripsheetStatus.APPROVED,
    });

    // Find existing salaries for this period
    const existingSalaries = await DriverSalary.find({
      month,
      year,
    });

    const existingTripsheetIds = new Set(
      existingSalaries.map((s: any) => s.tripsheetId.toString())
    );

    // Filter tripsheets that don't have salary yet
    const pendingTripsheets = approvedTripsheets.filter(
      (t) => !existingTripsheetIds.has(t._id.toString())
    );

    return NextResponse.json({
      success: true,
      data: {
        totalApproved: approvedTripsheets.length,
        pendingCount: pendingTripsheets.length,
        alreadyGenerated: existingSalaries.length,
      },
    });
  } catch (error: any) {
    console.error('Pending salary check error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check pending salaries',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

