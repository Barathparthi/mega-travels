import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleService from '@/backend/models/vehicle-service.model';
import Vehicle from '@/backend/models/vehicle.model';
import User from '@/backend/models/user.model';

/**
 * GET /api/driver/service-reminder
 * Get service reminder for driver's assigned vehicle
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const driver = await User.findById(session.user.id);
    if (!driver || !driver.assignedVehicleId) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No vehicle assigned',
      });
    }

    const vehicle = await Vehicle.findById(driver.assignedVehicleId).lean();
    if (!vehicle) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Vehicle not found',
      });
    }

    // Get latest service for this vehicle
    const latestService = await VehicleService.findOne({
      vehicleId: vehicle._id,
    })
      .sort({ serviceKm: -1, serviceDate: -1 })
      .lean();

    if (!latestService) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No service records found',
      });
    }

    const currentKm = vehicle.currentOdometer || 0;
    const lastServiceKm = latestService.serviceKm || 0;
    const kmSinceService = currentKm - lastServiceKm;
    const serviceIntervalKm = latestService.serviceIntervalKm || 10000;
    const nextServiceKm = latestService.nextServiceKm || (lastServiceKm + serviceIntervalKm);
    const daysSinceService = Math.floor(
      (new Date().getTime() - new Date(latestService.serviceDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if service is needed (show reminder if within 20% of interval or overdue)
    const needsService = kmSinceService >= serviceIntervalKm * 0.8 || currentKm >= nextServiceKm * 0.8;
    const isOverdue = kmSinceService > serviceIntervalKm || currentKm >= nextServiceKm;

    if (!needsService && !isOverdue) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Service not due yet',
      });
    }

    const status = isOverdue ? 'overdue' : 'due';
    const monthsSinceService = Math.floor(daysSinceService / 30);

    return NextResponse.json({
      success: true,
      data: {
        vehicleNumber: vehicle.vehicleNumber,
        lastService: {
          serviceType: latestService.serviceType,
          serviceDate: latestService.serviceDate,
          serviceKm: latestService.serviceKm,
        },
        currentKm,
        kmSinceService,
        daysSinceService,
        monthsSinceService,
        serviceIntervalKm,
        nextServiceKm,
        status,
        message: `This vehicle did ${latestService.serviceType} before ${monthsSinceService} ${monthsSinceService === 1 ? 'month' : 'months'} and ran more than ${kmSinceService.toLocaleString()} km. Service is ${status === 'overdue' ? 'OVERDUE' : 'due'} (threshold: ${serviceIntervalKm.toLocaleString()} km).`,
      },
    });
  } catch (error: any) {
    console.error('Get service reminder error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch service reminder',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

