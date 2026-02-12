import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import AdvanceSalary from '@/backend/models/advance-salary.model';
import { AdvanceSalaryStatus } from '@/backend/models/advance-salary.model';

/**
 * GET /api/admin/advance-salary/[id]
 * Get single advance salary by ID
 */
export async function GET(
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

    const advance = await AdvanceSalary.findById(params.id)
      .populate('driverId', 'name email phone')
      .populate('vehicleId', 'vehicleNumber vehicleTypeId')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .populate('rejectedBy', 'name')
      .lean();

    if (!advance) {
      return NextResponse.json(
        { success: false, message: 'Advance salary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: advance,
    });
  } catch (error: any) {
    console.error('Get advance salary error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch advance salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/advance-salary/[id]
 * Update advance salary (notes, reason, etc.)
 */
export async function PUT(
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
    const { notes, reason } = body;

    const advance = await AdvanceSalary.findById(params.id);

    if (!advance) {
      return NextResponse.json(
        { success: false, message: 'Advance salary not found' },
        { status: 404 }
      );
    }

    // Only allow updates if status is pending or approved (not paid/deducted)
    if (advance.status === AdvanceSalaryStatus.PAID || 
        advance.status === AdvanceSalaryStatus.DEDUCTED) {
      return NextResponse.json(
        { success: false, message: 'Cannot update paid or deducted advance' },
        { status: 400 }
      );
    }

    if (notes !== undefined) advance.notes = notes;
    if (reason !== undefined) advance.reason = reason;

    await advance.save();

    await advance.populate([
      { path: 'driverId', select: 'name email phone' },
      { path: 'vehicleId', select: 'vehicleNumber vehicleTypeId' },
      { path: 'approvedBy', select: 'name' },
      { path: 'paidBy', select: 'name' },
      { path: 'rejectedBy', select: 'name' },
    ]);

    return NextResponse.json({
      success: true,
      data: advance,
      message: 'Advance salary updated successfully',
    });
  } catch (error: any) {
    console.error('Update advance salary error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update advance salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

