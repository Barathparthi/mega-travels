import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/connection';
import User from '@/backend/models/user.model';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Ensure VehicleType model is registered
    VehicleType.modelName;

    // Find driver
    const driver = await User.findById(session.user.id).select(
      '-password'
    );

    if (!driver) {
      return NextResponse.json(
        { success: false, message: 'Driver not found' },
        { status: 404 }
      );
    }

    // Find assigned vehicle
    const vehicle = await Vehicle.findById(driver.assignedVehicleId).lean();

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'No vehicle assigned' },
        { status: 404 }
      );
    }

    // Manually fetch vehicle type since vehicleTypeId is a string (name), not ObjectId
    const vehicleType = await VehicleType.findOne({ name: vehicle.vehicleTypeId as string })
      .select('name code billingRules')
      .lean();

    if (!vehicleType) {
      return NextResponse.json(
        { success: false, message: 'Vehicle type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        driver: {
          id: driver._id.toString(),
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          joinedDate: driver.createdAt,
        },
        vehicle: {
          id: vehicle._id.toString(),
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicleType.name,
          vehicleTypeCode: vehicleType.code,
          routeName: vehicle.routeName,
          description: vehicle.description,
          extraHourRate: vehicleType.billingRules.extraHourRate,
        },
      },
    });
  } catch (error) {
    console.error('Driver info error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
