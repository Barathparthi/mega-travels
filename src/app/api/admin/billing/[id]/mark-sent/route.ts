import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Billing from '@/backend/models/billing.model';
import { BillingStatus } from '@/backend/types';

/**
 * POST /api/admin/billing/[id]/mark-sent
 * Mark a bill as sent to client
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

    if (bill.status === BillingStatus.SENT) {
      return NextResponse.json(
        { success: false, message: 'Bill is already marked as sent' },
        { status: 400 }
      );
    }

    // Update status to sent
    bill.status = BillingStatus.SENT;
    bill.sentAt = new Date();

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
      message: 'Bill marked as sent successfully',
    });
  } catch (error: any) {
    console.error('Mark bill as sent error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mark bill as sent',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
