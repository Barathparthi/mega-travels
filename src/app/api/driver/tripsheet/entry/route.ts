import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/connection';
import User from '@/backend/models/user.model';
import Tripsheet from '@/backend/models/tripsheet.model';
import Vehicle from '@/backend/models/vehicle.model';
import { calculateTotalHours, calculateExtraHours, calculateDriverExtraHours } from '@/backend/utils/time-calculator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { success: false, message: 'Date is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const driver = await User.findById(session.user.id);

    if (!driver || !driver.assignedVehicleId) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const tripsheet = await Tripsheet.findOne({
      vehicleId: driver.assignedVehicleId,
      month,
      year,
    });

    if (!tripsheet) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const entry = tripsheet.entries.find((e: any) => {
      const entryDate = new Date(e.date);
      return entryDate.toDateString() === date.toDateString();
    });

    return NextResponse.json({
      success: true,
      data: entry || null,
    });
  } catch (error) {
    console.error('Get entry error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'driver') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      date: dateStr,
      status,
      startingKm: startingKmRaw,
      closingKm: closingKmRaw,
      startingTime,
      closingTime,
      fuelLitres,
      fuelAmount,
      remarks,
    } = body;

    // Explicitly convert KM values to integers to prevent precision loss
    const startingKm = startingKmRaw !== undefined && startingKmRaw !== null 
      ? Math.round(Number(startingKmRaw)) 
      : undefined;
    const closingKm = closingKmRaw !== undefined && closingKmRaw !== null 
      ? Math.round(Number(closingKmRaw)) 
      : undefined;

    await dbConnect();

    const driver = await User.findById(session.user.id);

    if (!driver) {
      return NextResponse.json(
        { success: false, message: 'Driver not found', error: 'Driver not found' },
        { status: 404 }
      );
    }

    if (!driver.assignedVehicleId) {
      return NextResponse.json(
        {
          success: false,
          message: 'No vehicle assigned to this driver. Please contact admin.',
          error: 'No vehicle assigned'
        },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Query by vehicleId to match the unique compound index (vehicleId, month, year)
    let tripsheet = await Tripsheet.findOne({
      vehicleId: driver.assignedVehicleId,
      month,
      year,
    });

    if (!tripsheet) {
      // Create new tripsheet with all days of month
      const daysInMonth = new Date(year, month, 0).getDate();
      const entries = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const entryDate = new Date(year, month - 1, day);
        entries.push({
          date: entryDate,
          dayOfWeek: getDayName(entryDate),
          dayType: getDayType(entryDate),
          status: 'pending',
        });
      }

      tripsheet = await Tripsheet.create({
        vehicleId: driver.assignedVehicleId,
        driverId: driver._id,
        month,
        year,
        entries,
        status: 'draft',
      });
    }

    // Check if tripsheet is still editable
    if (tripsheet.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot edit entries. Tripsheet is ${tripsheet.status}.`,
          error: 'Tripsheet not editable'
        },
        { status: 400 }
      );
    }

    // Find entry for this date
    const entryIndex = tripsheet.entries.findIndex((e: any) => {
      const entryDate = new Date(e.date);
      return entryDate.toDateString() === date.toDateString();
    });

    if (entryIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Entry date not found in tripsheet', error: 'Date not found' },
        { status: 400 }
      );
    }

    // Update entry
    const entry: any = {
      date,
      dayOfWeek: getDayName(date),
      dayType: getDayType(date),
      status,
    };

    if (status === 'working') {
      // Validate required fields
      if (!startingKm || !closingKm || !startingTime || !closingTime) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields for working entry' },
          { status: 400 }
        );
      }

      if (closingKm <= startingKm) {
        return NextResponse.json(
          { success: false, message: 'Closing KM must be greater than Starting KM' },
          { status: 400 }
        );
      }

      // Ensure values are integers (prevent any precision issues)
      entry.startingKm = Math.round(startingKm);
      entry.closingKm = Math.round(closingKm);
      entry.totalKm = Math.round(closingKm - startingKm);
      entry.startingTime = startingTime;
      entry.closingTime = closingTime;
      entry.totalHours = calculateTotalHours(startingTime, closingTime);
      entry.extraHours = calculateExtraHours(entry.totalHours);
      entry.driverExtraHours = calculateDriverExtraHours(entry.totalHours);

      if (fuelLitres && fuelAmount) {
        entry.fuelLitres = fuelLitres;
        entry.fuelAmount = fuelAmount;
      }

      if (remarks) {
        entry.remarks = remarks;
      }
    } else if (status === 'off') {
      // Clear all working fields for off day
      entry.startingKm = undefined;
      entry.closingKm = undefined;
      entry.totalKm = undefined;
      entry.startingTime = undefined;
      entry.closingTime = undefined;
      entry.totalHours = undefined;
      entry.extraHours = undefined;
      entry.driverExtraHours = undefined;
      entry.fuelLitres = undefined;
      entry.fuelAmount = undefined;

      if (remarks) {
        entry.remarks = remarks;
      }
    }

    tripsheet.entries[entryIndex] = entry;
    await tripsheet.save();

    // Update vehicle's current odometer if this is a working entry with closing KM
    if (status === 'working' && closingKm) {
      await Vehicle.findByIdAndUpdate(
        driver.assignedVehicleId,
        { currentOdometer: Math.round(closingKm) },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry,
      message: 'Entry saved successfully',
    });
  } catch (error: any) {
    console.error('Save entry error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
