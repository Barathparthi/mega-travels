import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import DriverSalary from '@/backend/models/driver-salary.model';
import User from '@/backend/models/user.model';

/**
 * POST /api/admin/salary/[id]/mark-paid
 * Mark salary as paid
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
    const { notes } = body;

    const salary = await DriverSalary.findById(params.id);

    if (!salary) {
      return NextResponse.json(
        { success: false, message: 'Salary not found' },
        { status: 404 }
      );
    }

    // Check if already paid
    if (salary.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Salary is already marked as paid' },
        { status: 400 }
      );
    }

    // Get admin user
    const admin = await User.findOne({ email: session.user.email });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Update salary status
    salary.status = 'paid';
    salary.paidAt = new Date();
    salary.paidBy = admin._id;

    if (notes) {
      salary.notes = notes;
    }

    await salary.save();

    // Populate before returning
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
      {
        path: 'paidBy',
        select: 'name email',
      },
    ]);

    return NextResponse.json({
      success: true,
      data: salary,
      message: 'Salary marked as paid successfully',
    });
  } catch (error: any) {
    console.error('Mark salary paid error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to mark salary as paid',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
