import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Billing from '@/backend/models/billing.model';
import { BillingStatus } from '@/backend/types';

/**
 * POST /api/admin/billing/[id]/mark-paid
 * Mark a bill as paid by client
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

    const { id } = params;

    const bill = await Billing.findById(id);

    if (!bill) {
      return NextResponse.json(
        { success: false, message: 'Bill not found' },
        { status: 404 }
      );
    }

    // Check current status
    if (bill.status === BillingStatus.PAID) {
      return NextResponse.json(
        { success: false, message: 'Bill is already marked as paid' },
        { status: 400 }
      );
    }

    // Update status to paid
    bill.status = BillingStatus.PAID;
    bill.paidAt = new Date();

    // If not yet marked as sent, also set sentAt
    if (!bill.sentAt) {
      bill.sentAt = new Date();
    }

    await bill.save();

    // Populate before returning
    await bill.populate([
      {
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId',
        populate: {
          path: 'vehicleTypeId',
          select: 'name code'
        }
      },
      {
        path: 'driverId',
        select: 'name email phone'
      },
      {
        path: 'tripsheetId',
        select: 'tripsheetNumber status'
      }
    ]);

    return NextResponse.json({
      success: true,
      data: bill,
      message: 'Bill marked as paid successfully',
    });
  } catch (error: any) {
    console.error('Mark bill as paid error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mark bill as paid',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
