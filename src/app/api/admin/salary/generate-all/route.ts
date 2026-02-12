import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import DriverSalary from '@/backend/models/driver-salary.model';
import Tripsheet from '@/backend/models/tripsheet.model';
import AdvanceSalary from '@/backend/models/advance-salary.model';
import { calculateDriverSalary, numberToIndianWords } from '@/backend/utils/salary-calculator';
import { TripsheetStatus } from '@/backend/types';
import { AdvanceSalaryStatus } from '@/backend/models/advance-salary.model';

/**
 * POST /api/admin/salary/generate-all
 * Generate salaries for all approved tripsheets that don't have salary yet
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

    // Find all approved tripsheets for the month/year
    const approvedTripsheets = await Tripsheet.find({
      month,
      year,
      status: TripsheetStatus.APPROVED,
    });

    if (approvedTripsheets.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No approved tripsheets found for this period',
        },
        { status: 404 }
      );
    }

    // Find existing salaries for this period
    const existingSalaries = await DriverSalary.find({
      month,
      year,
    });

    const existingTripsheetIds = new Set(
      existingSalaries.map((s: any) => s.tripsheetId.toString())
    );

    // Filter tripsheets that don't have salary yet
    const tripsheetsToProcess = approvedTripsheets.filter(
      (t) => !existingTripsheetIds.has(t._id.toString())
    );

    if (tripsheetsToProcess.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'All approved tripsheets already have salaries generated',
        },
        { status: 400 }
      );
    }

    // Generate salaries for all tripsheets
    const generatedSalaries = [];
    const errors = [];

    for (const tripsheet of tripsheetsToProcess) {
      try {
        // Calculate salary
        const calculation = calculateDriverSalary(tripsheet.summary);

        // Get all paid advances for this driver for this month/year that haven't been deducted yet
        const paidAdvances = await AdvanceSalary.find({
          driverId: tripsheet.driverId,
          requestedMonth: tripsheet.month,
          requestedYear: tripsheet.year,
          status: AdvanceSalaryStatus.PAID,
          deductedFromSalaryId: { $exists: false },
        }).lean();

        // Calculate total advance amount to deduct
        const totalAdvanceAmount = paidAdvances.reduce(
          (sum, advance) => sum + (advance.amount || 0),
          0
        );

        // Deduct advances from total salary
        const finalSalary = Math.max(0, calculation.totalSalary - totalAdvanceAmount);
        const finalAmountInWords = numberToIndianWords(finalSalary);

        // Update calculation with deducted amount
        const finalCalculation: any = {
          ...calculation,
          totalSalary: finalSalary,
          advanceDeduction: totalAdvanceAmount,
          amountInWords: finalAmountInWords,
        };

        // Create new salary
        const salary = new DriverSalary({
          driverId: tripsheet.driverId,
          vehicleId: tripsheet.vehicleId,
          tripsheetId: tripsheet._id,
          month: tripsheet.month,
          year: tripsheet.year,
          calculation: finalCalculation,
          status: 'generated',
          notes: totalAdvanceAmount > 0 
            ? `Auto-generated in batch. Advance deduction: ₹${totalAdvanceAmount}`
            : 'Auto-generated in batch',
        });

        await salary.save();

        // Mark advances as deducted
        if (paidAdvances.length > 0) {
          await AdvanceSalary.updateMany(
            {
              _id: { $in: paidAdvances.map((a) => a._id) },
            },
            {
              $set: {
                status: AdvanceSalaryStatus.DEDUCTED,
                deductedFromSalaryId: salary._id,
                deductedAt: new Date(),
              },
            }
          );
        }

        generatedSalaries.push(salary);
      } catch (error: any) {
        errors.push({
          tripsheetId: tripsheet._id,
          tripsheetNumber: tripsheet.tripsheetNumber,
          error: error.message,
        });
      }
    }

    // Populate the generated salaries
    if (generatedSalaries.length > 0) {
      await DriverSalary.populate(generatedSalaries, [
        {
          path: 'driverId',
          select: 'name email phone licenseNumber',
        },
        {
          path: 'vehicleId',
          select: 'vehicleNumber description routeName',
        },
        {
          path: 'tripsheetId',
          select: 'tripsheetNumber status',
        },
      ]);
    }

    return NextResponse.json(
      {
        success: true,
        data: generatedSalaries,
        message: `Generated ${generatedSalaries.length} salaries successfully`,
        stats: {
          totalApprovedTripsheets: approvedTripsheets.length,
          alreadyGenerated: existingSalaries.length,
          newlyGenerated: generatedSalaries.length,
          errors: errors.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Batch salary generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate salaries',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
