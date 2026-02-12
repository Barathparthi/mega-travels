import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import AdvanceSalary from '@/backend/models/advance-salary.model';
import User from '@/backend/models/user.model';
import Vehicle from '@/backend/models/vehicle.model';
import { AdvanceSalaryStatus } from '@/backend/models/advance-salary.model';

/**
 * GET /api/admin/advance-salary
 * Get all advance salary requests with filters
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
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');
    const search = searchParams.get('search');

    // Build query
    const query: any = {};

    if (month) query.requestedMonth = parseInt(month);
    if (year) query.requestedYear = parseInt(year);
    if (status && status !== 'all') query.status = status;
    if (driverId) query.driverId = driverId;

    // Get all advances
    let advances = await AdvanceSalary.find(query)
      .populate('driverId', 'name email phone')
      .populate('vehicleId', 'vehicleNumber vehicleTypeId')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .populate('rejectedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      advances = advances.filter((advance: any) => {
        const driverName = advance.driverId?.name?.toLowerCase() || '';
        const vehicleNumber = advance.vehicleId?.vehicleNumber?.toLowerCase() || '';
        const advanceId = advance.advanceId?.toLowerCase() || '';
        return (
          driverName.includes(searchLower) ||
          vehicleNumber.includes(searchLower) ||
          advanceId.includes(searchLower)
        );
      });
    }

    // Calculate statistics
    const stats = {
      total: advances.length,
      pending: advances.filter((a: any) => a.status === 'pending').length,
      approved: advances.filter((a: any) => a.status === 'approved').length,
      paid: advances.filter((a: any) => a.status === 'paid').length,
      deducted: advances.filter((a: any) => a.status === 'deducted').length,
      rejected: advances.filter((a: any) => a.status === 'rejected').length,
      totalAmount: advances.reduce((sum: number, a: any) => sum + (a.amount || 0), 0),
      pendingAmount: advances
        .filter((a: any) => a.status === 'pending' || a.status === 'approved')
        .reduce((sum: number, a: any) => sum + (a.amount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: advances,
      stats,
    });
  } catch (error: any) {
    console.error('Advance salary list error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch advance salary requests',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/advance-salary
 * Create a new advance salary request (admin can create on behalf of driver)
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
    const { driverId, vehicleId, amount, requestedMonth, requestedYear, reason, notes } = body;

    // Validate required fields
    if (!driverId || !vehicleId || !amount || !requestedMonth || !requestedYear) {
      return NextResponse.json(
        {
          success: false,
          message: 'Driver, vehicle, amount, month, and year are required',
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Amount must be greater than 0',
        },
        { status: 400 }
      );
    }

    // Check if driver exists
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return NextResponse.json(
        {
          success: false,
          message: 'Driver not found',
        },
        { status: 404 }
      );
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          message: 'Vehicle not found',
        },
        { status: 404 }
      );
    }

    // Create advance salary request
    const advance = new AdvanceSalary({
      driverId,
      vehicleId,
      amount,
      requestedDate: new Date(),
      requestedMonth: parseInt(requestedMonth),
      requestedYear: parseInt(requestedYear),
      reason,
      status: AdvanceSalaryStatus.PENDING,
      notes,
    });

    await advance.save();

    // Populate before returning
    await advance.populate([
      { path: 'driverId', select: 'name email phone' },
      { path: 'vehicleId', select: 'vehicleNumber vehicleTypeId' },
    ]);

    return NextResponse.json(
      {
        success: true,
        data: advance,
        message: 'Advance salary request created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create advance salary error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create advance salary request',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

