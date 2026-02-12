import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/connection';
import User from '@/backend/models/user.model';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import Tripsheet from '@/backend/models/tripsheet.model';

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

    const driver = await User.findById(session.user.id);
    if (!driver) {
      console.error('Driver not found for session user ID:', session.user.id);
      return NextResponse.json(
        { success: false, message: 'Driver not found' },
        { status: 404 }
      );
    }

    if (!driver.assignedVehicleId) {
      console.log('Driver has no assigned vehicle:', driver.name);
      return NextResponse.json(
        { success: false, message: 'No vehicle assigned to this driver. Please contact admin.' },
        { status: 404 }
      );
    }

    const vehicle = await Vehicle.findById(driver.assignedVehicleId).lean();

    // Fetch vehicle type manually by name since vehicleTypeId stores the name as string
    let vehicleType = null;
    if (vehicle && vehicle.vehicleTypeId) {
      vehicleType = await VehicleType.findOne({ name: vehicle.vehicleTypeId }).lean();
    }

    if (!vehicle) {
      console.error('Vehicle not found for ID:', driver.assignedVehicleId);
      return NextResponse.json(
        { success: false, message: 'Assigned vehicle not found in database. Please contact admin.' },
        { status: 404 }
      );
    }

    if (!vehicleType) {
      console.warn('Vehicle type not found for name:', vehicle.vehicleTypeId);
    }

    // Get current month tripsheet
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    let tripsheet = await Tripsheet.findOne({
      vehicleId: driver.assignedVehicleId,
      month: currentMonth,
      year: currentYear,
    }).lean();

    // Initialize tripsheet if doesn't exist
    if (!tripsheet) {
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const entries = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day);
        entries.push({
          date,
          dayOfWeek: getDayName(date),
          dayType: getDayType(date),
          status: 'pending',
        });
      }

      tripsheet = await Tripsheet.create({
        vehicleId: driver.assignedVehicleId,
        driverId: driver._id,
        month: currentMonth,
        year: currentYear,
        entries,
        status: 'draft',
      });
    }

    // Find today's entry
    const todayEntry = tripsheet.entries.find((entry: any) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === today.getDate() &&
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getFullYear() === today.getFullYear()
      );
    });

    // Get recent entries (last 5 working or off entries)
    const recentEntries = tripsheet.entries
      .filter((e: any) => e.status !== 'pending')
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        todayEntry: todayEntry || null,
        todayStatus: todayEntry?.status || 'pending',
        monthSummary: {
          month: currentMonth,
          year: currentYear,
          ...tripsheet.summary,
          status: tripsheet.status,
        },
        recentEntries,
        vehicleInfo: {
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicleType?.name || vehicle.vehicleTypeId || 'Unknown',
          routeName: vehicle.routeName || 'Not Assigned',
          driverPassengers: vehicle.driverPassengers || 'None',
        },
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getDayName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function getDayType(date: Date): string {
  const day = date.getDay();
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  return 'working';
}
