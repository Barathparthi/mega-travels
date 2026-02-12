import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import DriverSalary from '@/backend/models/driver-salary.model';

/**
 * GET /api/admin/salary/[id]
 * Get single salary by ID
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

    const salary = await DriverSalary.findById(params.id)
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
        select: 'tripsheetNumber status entries summary',
      })
      .populate({
        path: 'paidBy',
        select: 'name email',
      });

    if (!salary) {
      return NextResponse.json(
        { success: false, message: 'Salary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: salary,
    });
  } catch (error: any) {
    console.error('Salary fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/salary/[id]
 * Update salary notes
 */
export async function PUT(
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

    // Update notes
    salary.notes = notes;
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
      message: 'Salary updated successfully',
    });
  } catch (error: any) {
    console.error('Salary update error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/salary/[id]
 * Delete salary (only if not paid)
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

    const salary = await DriverSalary.findById(params.id);

    if (!salary) {
      return NextResponse.json(
        { success: false, message: 'Salary not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of paid salaries
    if (salary.status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete paid salary' },
        { status: 400 }
      );
    }

    await salary.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Salary deleted successfully',
    });
  } catch (error: any) {
    console.error('Salary deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete salary',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
