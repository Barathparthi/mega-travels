import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import User from '@/backend/models/user.model';
import { TripsheetStatus } from '@/backend/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get admin user
    const admin = await User.findOne({ email: session.user.email });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Find tripsheet
    const tripsheet = await Tripsheet.findById(params.id);
    if (!tripsheet) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet not found' },
        { status: 404 }
      );
    }

    // Verify tripsheet is submitted
    if (tripsheet.status !== TripsheetStatus.SUBMITTED) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot approve tripsheet with status "${tripsheet.status}". Only submitted tripsheets can be approved.`,
        },
        { status: 400 }
      );
    }

    // Approve tripsheet
    tripsheet.status = TripsheetStatus.APPROVED;
    tripsheet.approvedAt = new Date();
    tripsheet.approvedBy = admin._id;

    await tripsheet.save();

    return NextResponse.json({
      success: true,
      message: 'Tripsheet approved successfully',
      data: tripsheet,
    });
  } catch (error: any) {
    console.error('Approve tripsheet error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to approve tripsheet',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
