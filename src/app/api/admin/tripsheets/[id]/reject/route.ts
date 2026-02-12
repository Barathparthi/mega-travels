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

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Rejection reason is required' },
        { status: 400 }
      );
    }

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
          message: `Cannot reject tripsheet with status "${tripsheet.status}". Only submitted tripsheets can be rejected.`,
        },
        { status: 400 }
      );
    }

    // Reject tripsheet (set back to draft so driver can edit)
    tripsheet.status = TripsheetStatus.DRAFT;
    tripsheet.rejectedAt = new Date();
    tripsheet.rejectedBy = admin._id;
    tripsheet.rejectionReason = reason;
    tripsheet.submittedAt = undefined; // Clear submission date

    await tripsheet.save();

    return NextResponse.json({
      success: true,
      message: 'Tripsheet rejected and sent back to driver',
      data: tripsheet,
    });
  } catch (error: any) {
    console.error('Reject tripsheet error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reject tripsheet',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
