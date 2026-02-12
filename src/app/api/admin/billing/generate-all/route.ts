import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import Billing from '@/backend/models/billing.model';
import { calculateBilling } from '@/lib/utils/billing-calculator';
import { TripsheetStatus } from '@/backend/types';

/**
 * POST /api/admin/billing/generate-all
 * Generate bills for all approved tripsheets without bills
 */
export async function POST(request: NextRequest) {
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
    const { month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        { success: false, message: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, message: 'Invalid month. Must be between 1 and 12' },
        { status: 400 }
      );
    }

    if (year < 2020) {
      return NextResponse.json(
        { success: false, message: 'Invalid year. Must be 2020 or later' },
        { status: 400 }
      );
    }

    // Find all approved tripsheets for the month/year
    const approvedTripsheets = await Tripsheet.find({
      month,
      year,
      status: TripsheetStatus.APPROVED,
    })
      .populate({
        path: 'vehicleId',
        populate: {
          path: 'vehicleTypeId'
        }
      });

    if (approvedTripsheets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No approved tripsheets found for the specified month/year' },
        { status: 404 }
      );
    }

    // Get existing bills for the month/year
    const existingBills = await Billing.find({ month, year }).select('tripsheetId');
    const billedTripsheetIds = new Set(existingBills.map(bill => bill.tripsheetId.toString()));

    // Filter tripsheets that don't have bills yet
    const pendingTripsheets = approvedTripsheets.filter(
      (tripsheet: any) => !billedTripsheetIds.has(tripsheet._id.toString())
    );

    if (pendingTripsheets.length === 0) {
      return NextResponse.json(
        { success: false, message: 'All approved tripsheets already have bills' },
        { status: 400 }
      );
    }

    // Generate bills for all pending tripsheets
    const generatedBills = [];
    const errors = [];

    for (const tripsheet of pendingTripsheets) {
      try {
        const vehicle = tripsheet.vehicleId as any;
        const vehicleType = vehicle.vehicleTypeId as any;

        if (!vehicleType || !vehicleType.billingRules) {
          errors.push({
            tripsheetId: tripsheet._id,
            error: 'Vehicle type or billing rules not found'
          });
          continue;
        }

        // Calculate billing
        const calculation = calculateBilling(tripsheet, vehicleType);

        // Generate bill number
        const billNumber = await Billing.generateBillNumber(tripsheet.year);

        // Create bill
        const bill = new Billing({
          billNumber,
          tripsheetId: tripsheet._id,
          vehicleId: vehicle._id,
          driverId: tripsheet.driverId,
          vehicleTypeId: vehicleType._id,
          month: tripsheet.month,
          year: tripsheet.year,
          calculation,
          status: 'generated',
        });

        await bill.save();
        generatedBills.push(bill);
      } catch (error: any) {
        errors.push({
          tripsheetId: tripsheet._id,
          error: error.message
        });
      }
    }

    // Populate the generated bills
    const populatedBills = await Billing.find({
      _id: { $in: generatedBills.map(b => b._id) }
    })
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId',
        populate: {
          path: 'vehicleTypeId',
          select: 'name code'
        }
      })
      .populate({
        path: 'driverId',
        select: 'name email phone'
      })
      .populate({
        path: 'tripsheetId',
        select: 'tripsheetNumber status'
      });

    return NextResponse.json(
      {
        success: true,
        data: populatedBills,
        message: `Generated ${generatedBills.length} bill(s) successfully`,
        summary: {
          total: pendingTripsheets.length,
          generated: generatedBills.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Generate all bills error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate bills',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
