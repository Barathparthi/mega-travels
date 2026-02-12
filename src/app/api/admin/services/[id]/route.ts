import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleService from '@/backend/models/vehicle-service.model';
import Vehicle from '@/backend/models/vehicle.model';

/**
 * GET /api/admin/services/[id]
 * Get a specific service record
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

    const service = await VehicleService.findById(params.id)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description currentOdometer',
      })
      .lean();

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    console.error('Get service error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch service record',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/services/[id]
 * Update a service record
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

    const service = await VehicleService.findById(params.id);
    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service record not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      serviceType,
      serviceDate,
      serviceKm,
      nextServiceKm,
      serviceIntervalKm,
      cost,
      serviceProvider,
      notes,
    } = body;

    // Update fields
    if (serviceType) service.serviceType = serviceType;
    if (serviceDate) service.serviceDate = new Date(serviceDate);
    if (serviceKm !== undefined) service.serviceKm = serviceKm;
    if (nextServiceKm !== undefined) service.nextServiceKm = nextServiceKm;
    if (serviceIntervalKm !== undefined) service.serviceIntervalKm = serviceIntervalKm;
    if (cost !== undefined) service.cost = cost;
    if (serviceProvider !== undefined) service.serviceProvider = serviceProvider;
    if (notes !== undefined) service.notes = notes;

    // Recalculate nextServiceKm if serviceKm or serviceIntervalKm changed
    if ((serviceKm !== undefined || serviceIntervalKm !== undefined) && !nextServiceKm) {
      const newServiceKm = serviceKm !== undefined ? serviceKm : service.serviceKm;
      const interval = serviceIntervalKm !== undefined ? serviceIntervalKm : service.serviceIntervalKm;
      if (newServiceKm && interval) {
        service.nextServiceKm = newServiceKm + interval;
      }
    }

    await service.save();

    // Populate vehicle before returning
    await service.populate({
      path: 'vehicleId',
      select: 'vehicleNumber description',
    });

    return NextResponse.json({
      success: true,
      data: service,
      message: 'Service record updated successfully',
    });
  } catch (error: any) {
    console.error('Update service error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update service record',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/services/[id]
 * Delete a service record
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

    const service = await VehicleService.findByIdAndDelete(params.id);
    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service record deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete service error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete service record',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

