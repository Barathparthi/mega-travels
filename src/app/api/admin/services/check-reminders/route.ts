import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleService from '@/backend/models/vehicle-service.model';
import Vehicle from '@/backend/models/vehicle.model';

/**
 * GET /api/admin/services/check-reminders
 * Check which vehicles need service based on current KM reading
 * Query params: vehicleId (optional) - check specific vehicle
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

    // Get vehicles to check
    const vehicleQuery: any = { isActive: true };
    if (vehicleId && vehicleId !== 'all') {
      vehicleQuery._id = vehicleId;
    }

    const vehicles = await Vehicle.find(vehicleQuery).lean();
    const reminders: Array<{
      vehicleId: string;
      vehicleNumber: string;
      lastService: any;
      currentKm: number;
      kmSinceService: number;
      daysSinceService: number;
      status: 'due' | 'overdue' | 'upcoming';
      message: string;
    }> = [];

    for (const vehicle of vehicles) {
      // Get latest service for this vehicle
      const latestService = await VehicleService.findOne({
        vehicleId: vehicle._id,
      })
        .sort({ serviceKm: -1, serviceDate: -1 })
        .lean();

      if (!latestService) {
        continue; // No service record, skip
      }

      const currentKm = vehicle.currentOdometer || 0;
      const lastServiceKm = latestService.serviceKm || 0;
      const kmSinceService = currentKm - lastServiceKm;
      const serviceIntervalKm = latestService.serviceIntervalKm || 10000;
      const nextServiceKm = latestService.nextServiceKm || (lastServiceKm + serviceIntervalKm);
      const daysSinceService = Math.floor(
        (new Date().getTime() - new Date(latestService.serviceDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if service is needed
      if (kmSinceService >= serviceIntervalKm || currentKm >= nextServiceKm) {
        const status = kmSinceService > serviceIntervalKm * 1.2 ? 'overdue' : 'due';
        
        reminders.push({
          vehicleId: vehicle._id.toString(),
          vehicleNumber: vehicle.vehicleNumber,
          lastService: {
            serviceType: latestService.serviceType,
            serviceDate: latestService.serviceDate,
            serviceKm: latestService.serviceKm,
          },
          currentKm,
          kmSinceService,
          daysSinceService,
          status,
          message: `Service done ${daysSinceService} days ago. Vehicle has run ${kmSinceService.toLocaleString()} km since last service (threshold: ${serviceIntervalKm.toLocaleString()} km). Service is ${status === 'overdue' ? 'OVERDUE' : 'due'}.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: reminders,
      total: reminders.length,
      overdue: reminders.filter(r => r.status === 'overdue').length,
      due: reminders.filter(r => r.status === 'due').length,
    });
  } catch (error: any) {
    console.error('Check service reminders error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check service reminders',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

