import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleLoan from '@/backend/models/vehicle-loan.model';

/**
 * GET /api/admin/loans/[id]
 * Get a specific loan record
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

    const loan = await VehicleLoan.findById(params.id)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber vehicleTypeId description',
      })
      .lean();

    if (!loan) {
      return NextResponse.json(
        { success: false, message: 'Loan record not found' },
        { status: 404 }
      );
    }

    // Calculate stats
    const today = new Date();
    const overduePayments = loan.payments.filter((p: any) => {
      const emiDate = new Date(p.emiDate);
      return p.status === 'pending' && emiDate < today;
    });

    const paidPayments = loan.payments.filter((p: any) => p.status === 'paid');
    const pendingPayments = loan.payments.filter((p: any) => p.status === 'pending');
    const remainingEmis = pendingPayments.length;

    return NextResponse.json({
      success: true,
      data: {
        ...loan,
        overdueCount: overduePayments.length,
        hasOverdue: overduePayments.length > 0,
        totalPaid: paidPayments.length,
        totalPending: pendingPayments.length,
        remainingEmis,
      },
    });
  } catch (error: any) {
    console.error('Get loan error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch loan record',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/loans/[id]
 * Update a loan record
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

    const loan = await VehicleLoan.findById(params.id);
    if (!loan) {
      return NextResponse.json(
        { success: false, message: 'Loan record not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      vehicleNumber,
      financeName,
      accountName,
      loanStartDate,
      loanAmount,
      emiAmount,
      totalEmis,
      emiDate,
      isActive,
    } = body;

    // Update fields
    if (vehicleNumber) loan.vehicleNumber = vehicleNumber.toUpperCase().trim();
    if (financeName) loan.financeName = financeName;
    if (accountName) loan.accountName = accountName;
    if (loanStartDate) loan.loanStartDate = new Date(loanStartDate);
    if (loanAmount !== undefined) loan.loanAmount = loanAmount;
    if (emiAmount !== undefined) loan.emiAmount = emiAmount;
    if (totalEmis !== undefined) loan.totalEmis = totalEmis;
    if (emiDate !== undefined) loan.emiDate = parseInt(emiDate);
    if (isActive !== undefined) loan.isActive = isActive;

    await loan.save();

    await loan.populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleTypeId description',
    });

    return NextResponse.json({
      success: true,
      data: loan,
      message: 'Loan record updated successfully',
    });
  } catch (error: any) {
    console.error('Update loan error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update loan record',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/loans/[id]
 * Delete a loan record
 */
export async function DELETE(
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

    const loan = await VehicleLoan.findByIdAndDelete(params.id);
    if (!loan) {
      return NextResponse.json(
        { success: false, message: 'Loan record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Loan record deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete loan error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete loan record',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

