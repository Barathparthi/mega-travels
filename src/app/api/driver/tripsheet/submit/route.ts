import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/connection';
import User from '@/backend/models/user.model';
import Tripsheet from '@/backend/models/tripsheet.model';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { month, year } = body;

    await dbConnect();

    const driver = await User.findById(session.user.id);

    const tripsheet = await Tripsheet.findOne({
      vehicleId: driver.assignedVehicleId,
      month,
      year,
    });

    if (!tripsheet) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet not found' },
        { status: 404 }
      );
    }

    // Check for pending entries
    const hasPending = tripsheet.entries.some((e: any) => e.status === 'pending');

    if (hasPending) {
      const pendingDates = tripsheet.entries
        .filter((e: any) => e.status === 'pending')
        .map((e: any) => new Date(e.date).toLocaleDateString());

      return NextResponse.json(
        {
          success: false,
          message: 'Cannot submit with pending entries',
          pendingDates,
        },
        { status: 400 }
      );
    }

    // Submit tripsheet
    tripsheet.status = 'submitted';
    tripsheet.submittedAt = new Date();
    await tripsheet.save();

    return NextResponse.json({
      success: true,
      data: tripsheet,
      message: 'Tripsheet submitted successfully',
    });
  } catch (error) {
    console.error('Submit tripsheet error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
