import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import Vehicle from '@/backend/models/vehicle.model';
import User from '@/backend/models/user.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import { IFuelEntry } from '@/backend/types';

/**
 * GET /api/admin/fuel/[vehicleId]
 * Get detailed fuel entries for a specific vehicle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
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

    const { vehicleId } = params;
    const { searchParams } = new URL(request.url);

    // Get date range (default to current month)
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Get vehicle details
    const vehicle = await Vehicle.findById(vehicleId)
      .populate('assignedDriverId')
      .lean();

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Manually fetch vehicle type since vehicleTypeId is a string (name), not ObjectId
    const vehicleType = await VehicleType.findOne({ name: vehicle.vehicleTypeId as string })
      .select('name code')
      .lean();

    // Get tripsheets for the date range
    const tripsheets = await Tripsheet.find({
      vehicleId,
      status: 'approved',
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ month: 1, year: 1 })
      .lean();

    // Extract and process fuel entries
    const fuelEntries: IFuelEntry[] = [];
    let prevOdometer = 0;

    for (const tripsheet of tripsheets) {
      const entries = tripsheet.entries as any[];

      for (const entry of entries) {
        if (entry.fuelLitres && entry.fuelAmount) {
          const odometer = entry.closingKm || entry.startingKm || 0;
          const kmSinceLast = prevOdometer > 0 ? odometer - prevOdometer : 0;
          const mileage =
            entry.fuelLitres > 0 && kmSinceLast > 0
              ? kmSinceLast / entry.fuelLitres
              : 0;

          fuelEntries.push({
            date: entry.date,
            litres: entry.fuelLitres,
            amount: entry.fuelAmount,
            ratePerLitre: entry.fuelAmount / entry.fuelLitres,
            odometer,
            kmSinceLast,
            mileage,
          });

          if (odometer > 0) {
            prevOdometer = odometer;
          }
        }
      }
    }

    // Calculate summary
    const totalLitres = fuelEntries.reduce((sum, e) => sum + e.litres, 0);
    const totalAmount = fuelEntries.reduce((sum, e) => sum + e.amount, 0);
    const totalKm = fuelEntries.reduce((sum, e) => sum + (e.kmSinceLast || 0), 0);
    const averageMileage = totalLitres > 0 ? totalKm / totalLitres : 0;
    const averageRatePerLitre = totalLitres > 0 ? totalAmount / totalLitres : 0;

    const driver = vehicle.assignedDriverId as any;

    return NextResponse.json({
      success: true,
      data: {
        vehicle: {
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicleType?.name || vehicle.vehicleTypeId || 'Unknown',
          driverName: driver?.name || 'Unassigned',
        },
        summary: {
          totalKm,
          totalLitres,
          totalAmount,
          averageMileage,
          averageRatePerLitre,
          entryCount: fuelEntries.length,
        },
        entries: fuelEntries,
        dateRange: {
          startDate,
          endDate,
        },
      },
    });
  } catch (error: any) {
    console.error('Vehicle fuel detail error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch vehicle fuel details',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
