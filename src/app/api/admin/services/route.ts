import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleService from '@/backend/models/vehicle-service.model';
import Vehicle from '@/backend/models/vehicle.model';

/**
 * GET /api/admin/services
 * List all vehicle services with filters
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = {};
    if (vehicleId && vehicleId !== 'all') {
      query.vehicleId = vehicleId;
    }

    // Get total count
    const total = await VehicleService.countDocuments(query);

    // Fetch services with pagination
    const services = await VehicleService.find(query)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description',
      })
      .sort({ serviceDate: -1, serviceKm: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: services,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List services error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch services',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/services
 * Create a new vehicle service record
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
      serviceType,
      serviceDate,
      serviceKm,
      nextServiceKm,
      serviceIntervalKm,
      cost,
      serviceProvider,
      notes,
    } = body;

    // Validation
    if (!vehicleId || !serviceType || !serviceDate || serviceKm === undefined) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID, service type, service date, and service KM are required' },
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

    // Calculate nextServiceKm if not provided but serviceIntervalKm is provided
    let calculatedNextServiceKm = nextServiceKm;
    if (!calculatedNextServiceKm && serviceIntervalKm) {
      calculatedNextServiceKm = serviceKm + serviceIntervalKm;
    }

    // Create service record
    const service = new VehicleService({
      vehicleId,
      serviceType,
      serviceDate: new Date(serviceDate),
      serviceKm,
      nextServiceKm: calculatedNextServiceKm,
      serviceIntervalKm: serviceIntervalKm || 10000,
      cost,
      serviceProvider,
      notes,
    });

    await service.save();

    // Populate vehicle before returning
    await service.populate({
      path: 'vehicleId',
      select: 'vehicleNumber description',
    });

    return NextResponse.json({
      success: true,
      data: service,
      message: 'Service record created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create service error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create service record',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

