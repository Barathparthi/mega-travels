import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import AdvanceSalary from '@/backend/models/advance-salary.model';
import User from '@/backend/models/user.model';
import { AdvanceSalaryStatus } from '@/backend/models/advance-salary.model';

/**
 * POST /api/admin/advance-salary/[id]/approve
 * Approve an advance salary request
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
          message: `Advance salary is already ${advance.status}`,
        },
        { status: 400 }
      );
    }

    // Approve the advance
    advance.status = AdvanceSalaryStatus.APPROVED;
    advance.approvedBy = admin._id;
    advance.approvedAt = new Date();

    await advance.save();

    await advance.populate([
      { path: 'driverId', select: 'name email phone' },
      { path: 'vehicleId', select: 'vehicleNumber vehicleTypeId' },
      { path: 'approvedBy', select: 'name' },
    ]);

    return NextResponse.json({
      success: true,
      data: advance,
      message: 'Advance salary approved successfully',
    });
  } catch (error: any) {
    console.error('Approve advance salary error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to approve advance salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

