import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/connection';
import User from '@/backend/models/user.model';
import Tripsheet from '@/backend/models/tripsheet.model';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { success: false, message: 'Date is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const driver = await User.findById(session.user.id);

    if (!driver || !driver.assignedVehicleId) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Parse date properly to avoid timezone issues
    const targetDate = new Date(dateStr + 'T00:00:00');

    // Find tripsheet for current and previous months
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;

    // Try current month first - use vehicleId to match unique compound index
    let tripsheet = await Tripsheet.findOne({
      vehicleId: driver.assignedVehicleId,
      month,
      year,
    }).lean();

    let previousEntry = null;

    if (tripsheet) {
      // Find the most recent entry before target date with working status
      const workingEntries = tripsheet.entries
        .filter((e: any) => {
          const entryDate = new Date(e.date);
          // Compare dates properly (ignore time)
          const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
          const targetDateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
          return (
            e.status === 'working' &&
            e.closingKm !== undefined &&
            entryDateOnly < targetDateOnly
          );
        })
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (workingEntries.length > 0) {
        previousEntry = workingEntries[0];
      }
    }

    // If not found in current month, check previous month
    if (!previousEntry) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const prevTripsheet = await Tripsheet.findOne({
        vehicleId: driver.assignedVehicleId,
        month: prevMonth,
        year: prevYear,
      }).lean();

      if (prevTripsheet) {
        const workingEntries = prevTripsheet.entries
          .filter((e: any) => e.status === 'working' && e.closingKm !== undefined)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (workingEntries.length > 0) {
          previousEntry = workingEntries[0];
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: previousEntry
        ? {
          date: previousEntry.date,
          closingKm: previousEntry.closingKm,
        }
        : null,
    });
  } catch (error) {
    console.error('Get previous KM error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
