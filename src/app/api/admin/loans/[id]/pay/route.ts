import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleLoan from '@/backend/models/vehicle-loan.model';

/**
 * POST /api/admin/loans/[id]/pay
 * Mark an EMI payment as paid
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

    const loan = await VehicleLoan.findById(params.id);
    if (!loan) {
      return NextResponse.json(
        { success: false, message: 'Loan record not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { paymentIndex, paidDate, remarks } = body;

    if (paymentIndex === undefined || paymentIndex === null) {
      return NextResponse.json(
        { success: false, message: 'Payment index is required' },
        { status: 400 }
      );
    }

    if (paymentIndex < 0 || paymentIndex >= loan.payments.length) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment index' },
        { status: 400 }
      );
    }

    // Mark payment as paid
    loan.payments[paymentIndex].status = 'paid';
    loan.payments[paymentIndex].paidDate = paidDate ? new Date(paidDate) : new Date();
    if (remarks) {
      loan.payments[paymentIndex].remarks = remarks;
    }

    await loan.save();

    // Calculate remaining EMIs
    const pendingPayments = loan.payments.filter(p => p.status === 'pending');
    const remainingEmis = pendingPayments.length;

    return NextResponse.json({
      success: true,
      data: loan,
      message: 'Payment marked as paid successfully',
      remainingEmis,
    });
  } catch (error: any) {
    console.error('Mark payment paid error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mark payment as paid',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/loans/[id]/pay-multiple
 * Mark multiple EMI payments as paid
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
    const { paymentIndices, paidDate, remarks } = body;

    if (!Array.isArray(paymentIndices) || paymentIndices.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Payment indices array is required' },
        { status: 400 }
      );
    }

    const paidDateObj = paidDate ? new Date(paidDate) : new Date();

    // Mark multiple payments as paid
    paymentIndices.forEach((index: number) => {
      if (index >= 0 && index < loan.payments.length) {
        loan.payments[index].status = 'paid';
        loan.payments[index].paidDate = paidDateObj;
        if (remarks) {
          loan.payments[index].remarks = remarks;
        }
      }
    });

    await loan.save();

    // Calculate remaining EMIs
    const pendingPayments = loan.payments.filter(p => p.status === 'pending');
    const remainingEmis = pendingPayments.length;

    return NextResponse.json({
      success: true,
      data: loan,
      message: 'Payments marked as paid successfully',
      remainingEmis,
    });
  } catch (error: any) {
    console.error('Mark payments paid error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mark payments as paid',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

