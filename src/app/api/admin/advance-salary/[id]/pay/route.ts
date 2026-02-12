import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import AdvanceSalary from '@/backend/models/advance-salary.model';
import User from '@/backend/models/user.model';
import { AdvanceSalaryStatus } from '@/backend/models/advance-salary.model';

/**
 * POST /api/admin/advance-salary/[id]/pay
 * Mark advance salary as paid (when given to driver)
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
    const { notes } = body;

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

    if (advance.status !== AdvanceSalaryStatus.APPROVED) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only approved advance salary can be marked as paid',
        },
        { status: 400 }
      );
    }

    // Mark as paid
    advance.status = AdvanceSalaryStatus.PAID;
    advance.paidAt = new Date();
    advance.paidBy = admin._id;
    if (notes) {
      advance.notes = notes;
    }

    await advance.save();

    await advance.populate([
      { path: 'driverId', select: 'name email phone' },
      { path: 'vehicleId', select: 'vehicleNumber vehicleTypeId' },
      { path: 'paidBy', select: 'name' },
    ]);

    return NextResponse.json({
      success: true,
      data: advance,
      message: 'Advance salary marked as paid successfully',
    });
  } catch (error: any) {
    console.error('Mark advance paid error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mark advance salary as paid',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

