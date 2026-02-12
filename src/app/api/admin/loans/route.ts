import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleLoan from '@/backend/models/vehicle-loan.model';
import Vehicle from '@/backend/models/vehicle.model';

/**
 * GET /api/admin/loans
 * List all vehicle loans with filters
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

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const status = searchParams.get('status'); // 'active', 'all', 'overdue'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    const query: any = {};
    if (vehicleId && vehicleId !== 'all') {
      query.vehicleId = vehicleId;
    }
    if (status !== 'all') {
      query.isActive = status !== 'inactive';
    }

    // Get total count
    const total = await VehicleLoan.countDocuments(query);

    // Fetch loans with pagination
    const loans = await VehicleLoan.find(query)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber vehicleTypeId description',
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate overdue status for each loan
    const loansWithStatus = loans.map((loan: any) => {
      const today = new Date();
      const overduePayments = loan.payments.filter((p: any) => {
        const emiDate = new Date(p.emiDate);
        return p.status === 'pending' && emiDate < today;
      });

      return {
        ...loan,
        overdueCount: overduePayments.length,
        hasOverdue: overduePayments.length > 0,
        totalPaid: loan.payments.filter((p: any) => p.status === 'paid').length,
        totalPending: loan.payments.filter((p: any) => p.status === 'pending').length,
      };
    });

    return NextResponse.json({
      success: true,
      data: loansWithStatus,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List loans error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch loans',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/loans
 * Create a new vehicle loan record
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
    const {
      vehicleId,
      vehicleNumber,
      financeName,
      accountName,
      loanStartDate,
      loanAmount,
      emiAmount,
      totalEmis,
      emiDate,
    } = body;

    // Validation
    if (!vehicleId || !vehicleNumber || !financeName || !accountName || !loanStartDate || !emiAmount || !emiDate) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID, vehicle number, finance name, account name, loan start date, EMI amount, and EMI date are required' },
        { status: 400 }
      );
    }

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Generate initial payment records based on totalEmis
    const payments: any[] = [];
    if (totalEmis && totalEmis > 0) {
      const startDate = new Date(loanStartDate);
      for (let i = 0; i < totalEmis; i++) {
        const emiDateObj = new Date(startDate);
        emiDateObj.setMonth(startDate.getMonth() + i);
        emiDateObj.setDate(emiDate);

        payments.push({
          emiDate: emiDateObj,
          amount: emiAmount,
          status: 'pending',
        });
      }
    } else {
      // If no totalEmis, create payment for the first EMI date
      const firstEmiDate = new Date(loanStartDate);
      firstEmiDate.setDate(emiDate);
      if (firstEmiDate < new Date(loanStartDate)) {
        firstEmiDate.setMonth(firstEmiDate.getMonth() + 1);
      }

      payments.push({
        emiDate: firstEmiDate,
        amount: emiAmount,
        status: 'pending',
      });
    }

    // Create loan record
    const loan = new VehicleLoan({
      vehicleId,
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      financeName,
      accountName,
      loanStartDate: new Date(loanStartDate),
      loanAmount,
      emiAmount,
      totalEmis,
      emiDate: parseInt(emiDate),
      payments,
    });

    await loan.save();

    // Populate vehicle before returning
    await loan.populate({
      path: 'vehicleId',
      select: 'vehicleNumber vehicleTypeId description',
    });

    return NextResponse.json({
      success: true,
      data: loan,
      message: 'Loan record created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create loan error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create loan record',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

