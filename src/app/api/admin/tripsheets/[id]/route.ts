import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import { calculateBilling } from '@/lib/utils/billing';

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

    const tripsheet = await Tripsheet.findById(params.id)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId currentOdometer'
      })
      .populate({
        path: 'driverId',
        select: 'name email phone licenseNumber'
      })
      .populate({
        path: 'approvedBy',
        select: 'name email'
      })
      .populate({
        path: 'rejectedBy',
        select: 'name email'
      });

    if (!tripsheet) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet not found' },
        { status: 404 }
      );
    }

    // Manually populate vehicle type since vehicleTypeId is a string (name), not ObjectId
    const vehicle: any = tripsheet.vehicleId;
    let vehicleType: any = null;
    if (vehicle && vehicle.vehicleTypeId) {
      vehicleType = await VehicleType.findOne({ 
        name: vehicle.vehicleTypeId 
      }).select('name code billingRules').lean();
      // Attach to vehicle for response
      vehicle.vehicleTypeId = vehicleType;
    }
    const billing = calculateBilling(tripsheet as any, vehicleType);

    return NextResponse.json({
      success: true,
      data: {
        tripsheet,
        billing,
      },
    });
  } catch (error: any) {
    console.error('Tripsheet detail error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch tripsheet',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
