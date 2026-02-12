import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import AdvanceSalary from '@/backend/models/advance-salary.model';
import DriverSalary from '@/backend/models/driver-salary.model';
import { AdvanceSalaryStatus } from '@/backend/models/advance-salary.model';

/**
 * POST /api/admin/advance-salary/[id]/deduct
 * Manually deduct an advance from a specific salary (if not auto-deducted)
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
    const { salaryId } = body;

    if (!salaryId) {
      return NextResponse.json(
        { success: false, message: 'Salary ID is required' },
        { status: 400 }
      );
    }

    const advance = await AdvanceSalary.findById(params.id);
    if (!advance) {
      return NextResponse.json(
        { success: false, message: 'Advance salary not found' },
        { status: 404 }
      );
    }

    if (advance.status !== AdvanceSalaryStatus.PAID) {
      return NextResponse.json(
        {
          success: false,
          message: 'Only paid advances can be deducted from salary',
        },
        { status: 400 }
      );
    }

    if (advance.deductedFromSalaryId) {
      return NextResponse.json(
        {
          success: false,
          message: 'This advance has already been deducted from a salary',
        },
        { status: 400 }
      );
    }

    const salary = await DriverSalary.findById(salaryId);
    if (!salary) {
      return NextResponse.json(
        { success: false, message: 'Salary not found' },
        { status: 404 }
      );
    }

    // Verify driver matches
    if (salary.driverId.toString() !== advance.driverId.toString()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Advance and salary must belong to the same driver',
        },
        { status: 400 }
      );
    }

    // Deduct advance from salary
    const newTotalSalary = Math.max(0, salary.calculation.totalSalary - advance.amount);
    
    // Recalculate amount in words
    const { numberToIndianWords } = await import('@/backend/utils/salary-calculator');
    const newAmountInWords = numberToIndianWords(newTotalSalary);
    
    // Update salary calculation
    salary.calculation.totalSalary = newTotalSalary;
    if (!salary.calculation.advanceDeduction) {
      salary.calculation.advanceDeduction = 0;
    }
    salary.calculation.advanceDeduction += advance.amount;
    salary.calculation.amountInWords = newAmountInWords;
    
    // Update notes
    const advanceNote = `Advance deduction: ₹${advance.amount}`;
    salary.notes = salary.notes
      ? `${salary.notes}; ${advanceNote}`
      : advanceNote;

    await salary.save();

    // Mark advance as deducted
    advance.status = AdvanceSalaryStatus.DEDUCTED;
    advance.deductedFromSalaryId = salary._id;
    advance.deductedAt = new Date();

    await advance.save();

    await advance.populate([
      { path: 'driverId', select: 'name email phone' },
      { path: 'vehicleId', select: 'vehicleNumber vehicleTypeId' },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        advance,
        salary: {
          _id: salary._id,
          salaryId: salary.salaryId,
          totalSalary: salary.calculation.totalSalary,
          advanceDeduction: salary.calculation.advanceDeduction,
        },
      },
      message: 'Advance deducted from salary successfully',
    });
  } catch (error: any) {
    console.error('Deduct advance error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to deduct advance from salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

