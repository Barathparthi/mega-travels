import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import DriverSalary from '@/backend/models/driver-salary.model';
import Tripsheet from '@/backend/models/tripsheet.model';
import AdvanceSalary from '@/backend/models/advance-salary.model';
import { calculateDriverSalary } from '@/backend/utils/salary-calculator';
import { TripsheetStatus } from '@/backend/types';
import { AdvanceSalaryStatus } from '@/backend/models/advance-salary.model';

/**
 * GET /api/admin/salary
 * List all driver salaries with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month')
      ? parseInt(searchParams.get('month')!)
      : new Date().getMonth() + 1;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : new Date().getFullYear();
    const status = searchParams.get('status') || 'all';
    const driverId = searchParams.get('driverId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = { month, year };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (driverId) {
      query.driverId = driverId;
    }

    // Get total count for pagination
    const total = await DriverSalary.countDocuments(query);

    // Fetch salaries with pagination and populate
    let salariesQuery = DriverSalary.find(query)
      .populate({
        path: 'driverId',
        select: 'name email phone licenseNumber',
      })
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName',
      })
      .populate({
        path: 'tripsheetId',
        select: 'tripsheetNumber status',
      })
      .populate({
        path: 'paidBy',
        select: 'name email',
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const salaries = await salariesQuery;

    // Filter by search term if provided
    let filteredSalaries = salaries;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSalaries = salaries.filter((salary: any) => {
        const driverName = salary.driverId?.name?.toLowerCase() || '';
        const vehicleNumber = salary.vehicleId?.vehicleNumber?.toLowerCase() || '';
        const salaryId = salary.salaryId?.toLowerCase() || '';
        return (
          driverName.includes(searchLower) ||
          vehicleNumber.includes(searchLower) ||
          salaryId.includes(searchLower)
        );
      });
    }

    // Calculate stats
    const allSalaries = await DriverSalary.find({ month, year });
    const stats = {
      total: allSalaries.length,
      pending: allSalaries.filter((s: any) => s.status === 'pending').length,
      generated: allSalaries.filter((s: any) => s.status === 'generated').length,
      paid: allSalaries.filter((s: any) => s.status === 'paid').length,
      totalAmount: allSalaries.reduce(
        (sum: number, s: any) => sum + (s.calculation?.totalSalary || 0),
        0
      ),
      paidAmount: allSalaries
        .filter((s: any) => s.status === 'paid')
        .reduce((sum: number, s: any) => sum + (s.calculation?.totalSalary || 0), 0),
      unpaidAmount: allSalaries
        .filter((s: any) => s.status !== 'paid')
        .reduce((sum: number, s: any) => sum + (s.calculation?.totalSalary || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: filteredSalaries,
      pagination: {
        total: search ? filteredSalaries.length : total,
        page,
        limit,
        totalPages: Math.ceil((search ? filteredSalaries.length : total) / limit),
      },
      stats,
    });
  } catch (error: any) {
    console.error('Admin salary list error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch salaries',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/salary
 * Generate salary for a specific tripsheet
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
    const { tripsheetId, notes } = body;

    if (!tripsheetId) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet ID is required' },
        { status: 400 }
      );
    }

    // Check if salary already exists for this tripsheet
    const existingSalary = await DriverSalary.findOne({ tripsheetId });
    if (existingSalary) {
      return NextResponse.json(
        {
          success: false,
          message: 'Salary already exists for this tripsheet',
        },
        { status: 400 }
      );
    }

    // Fetch tripsheet
    const tripsheet = await Tripsheet.findById(tripsheetId);

    if (!tripsheet) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet not found' },
        { status: 404 }
      );
    }

    // Check if tripsheet is approved
    if (tripsheet.status !== TripsheetStatus.APPROVED) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tripsheet must be approved before generating salary',
        },
        { status: 400 }
      );
    }

    // Calculate salary using the salary calculator
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

    // Recalculate amount in words for final salary
    const { numberToIndianWords } = await import('@/backend/utils/salary-calculator');
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
      notes: notes || (totalAdvanceAmount > 0 ? `Advance deduction: ₹${totalAdvanceAmount}` : undefined),
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

    // Populate the salary before returning
    await salary.populate([
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

    return NextResponse.json(
      {
        success: true,
        data: salary,
        message: 'Salary generated successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Salary generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
