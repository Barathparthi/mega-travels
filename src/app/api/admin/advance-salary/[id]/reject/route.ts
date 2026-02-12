import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import AdvanceSalary from '@/backend/models/advance-salary.model';
import User from '@/backend/models/user.model';
import { AdvanceSalaryStatus } from '@/backend/models/advance-salary.model';

/**
 * POST /api/admin/advance-salary/[id]/reject
 * Reject an advance salary request
 */
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
    const { rejectionReason } = body;

    const admin = await User.findById(session.user.id);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      );
    }

    const advance = await AdvanceSalary.findById(params.id);

    if (!advance) {
      return NextResponse.json(
        { success: false, message: 'Advance salary not found' },
        { status: 404 }
      );
    }

    if (advance.status !== AdvanceSalaryStatus.PENDING) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot reject advance salary with status ${advance.status}`,
        },
        { status: 400 }
      );
    }

    // Reject the advance
    advance.status = AdvanceSalaryStatus.REJECTED;
    advance.rejectedBy = admin._id;
    advance.rejectedAt = new Date();
    if (rejectionReason) {
      advance.rejectionReason = rejectionReason;
    }

    await advance.save();

    await advance.populate([
      { path: 'driverId', select: 'name email phone' },
      { path: 'vehicleId', select: 'vehicleNumber vehicleTypeId' },
      { path: 'rejectedBy', select: 'name' },
    ]);

    return NextResponse.json({
      success: true,
      data: advance,
      message: 'Advance salary rejected successfully',
    });
  } catch (error: any) {
    console.error('Reject advance salary error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reject advance salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

