import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Billing from '@/backend/models/billing.model';
import { BillingStatus } from '@/backend/types';
import { numberToIndianWords } from '@/lib/utils/billing-calculator';

/**
 * GET /api/admin/billing/[id]
 * Get a single bill by ID
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

    const { id } = params;

    const bill = await Billing.findById(id)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId',
        populate: {
          path: 'vehicleTypeId',
          select: 'name code billingRules'
        }
      })
      .populate({
        path: 'driverId',
        select: 'name email phone licenseNumber'
      })
      .populate({
        path: 'tripsheetId',
        select: 'tripsheetNumber status summary entries'
      })
      .populate({
        path: 'vehicleTypeId',
        select: 'name code billingRules'
      });

    if (!bill) {
      return NextResponse.json(
        { success: false, message: 'Bill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error: any) {
    console.error('Get bill error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch bill',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/billing/[id]
 * Update a bill (adjustments and recalculate)
 */
export async function PATCH(
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
    const body = await request.json();
    const { adjustments } = body;

    const bill = await Billing.findById(id);

    if (!bill) {
      return NextResponse.json(
        { success: false, message: 'Bill not found' },
        { status: 404 }
      );
    }

    // Check if bill is already paid
    if (bill.status === BillingStatus.PAID) {
      return NextResponse.json(
        { success: false, message: 'Cannot update a paid bill' },
        { status: 400 }
      );
    }

    // Update adjustments if provided
    if (adjustments !== undefined) {
      if (typeof adjustments !== 'number') {
        return NextResponse.json(
          { success: false, message: 'Adjustments must be a number' },
          { status: 400 }
        );
      }

      // Recalculate total amount
      bill.calculation.adjustments = adjustments;
      bill.calculation.totalAmount = bill.calculation.subTotal + adjustments;
      bill.calculation.amountInWords = numberToIndianWords(bill.calculation.totalAmount);
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
      message: 'Bill updated successfully',
    });
  } catch (error: any) {
    console.error('Update bill error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update bill',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/billing/[id]
 * Delete a bill (only if not paid)
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

    const { id } = params;

    const bill = await Billing.findById(id);

    if (!bill) {
      return NextResponse.json(
        { success: false, message: 'Bill not found' },
        { status: 404 }
      );
    }

    // Check if bill is already paid
    if (bill.status === BillingStatus.PAID) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete a paid bill' },
        { status: 400 }
      );
    }

    await bill.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Bill deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete bill error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete bill',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
