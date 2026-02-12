import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import Vehicle from '@/backend/models/vehicle.model';
import User from '@/backend/models/user.model';

/**
 * GET /api/admin/daily-entries
 * Get all entries for a specific date across all drivers
 * Query params: date (YYYY-MM-DD format)
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

    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { success: false, message: 'Date parameter is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Parse the date
    const selectedDate = new Date(dateStr + 'T00:00:00');
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    // Get all active vehicles with assigned drivers
    const vehicles = await Vehicle.find({
      status: 'active',
      assignedDriverId: { $exists: true, $ne: null }
    })
      .populate('assignedDriverId', 'name email phone')
      .lean();

    // Get all tripsheets for this month
    const tripsheets = await Tripsheet.find({
      month,
      year,
      vehicleId: { $in: vehicles.map(v => v._id) }
    }).lean();

    // Map entries by vehicle/driver
    const entriesByVehicle = new Map();

    // Initialize all vehicles
    vehicles.forEach(vehicle => {
      const driver = vehicle.assignedDriverId as any;
      entriesByVehicle.set(vehicle._id.toString(), {
        vehicleId: vehicle._id.toString(),
        vehicleNumber: vehicle.vehicleNumber,
        routeName: vehicle.routeName || 'N/A',
        driverId: driver?._id?.toString() || null,
        driverName: driver?.name || 'Unassigned',
        driverPhone: driver?.phone || 'N/A',
        hasEntry: false,
        entry: null,
        status: 'pending' // pending, working, off
      });
    });

    // Process entries from tripsheets
    tripsheets.forEach(tripsheet => {
      const entry = tripsheet.entries.find((e: any) => {
        const entryDate = new Date(e.date);
        return (
          entryDate.getDate() === selectedDate.getDate() &&
          entryDate.getMonth() === selectedDate.getMonth() &&
          entryDate.getFullYear() === selectedDate.getFullYear()
        );
      });

      if (entry && entry.status !== 'pending') {
        const vehicleEntry = entriesByVehicle.get(tripsheet.vehicleId.toString());
        if (vehicleEntry) {
          vehicleEntry.hasEntry = true;
          vehicleEntry.entry = entry;
          vehicleEntry.status = entry.status;
        }
      }
    });

    // Convert map to array
    const entries = Array.from(entriesByVehicle.values());

    // Calculate statistics
    const stats = {
      total: entries.length,
      entered: entries.filter(e => e.hasEntry && e.status === 'working').length,
      offDays: entries.filter(e => e.hasEntry && e.status === 'off').length,
      pending: entries.filter(e => !e.hasEntry || e.status === 'pending').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
        entries,
        stats,
      },
    });
  } catch (error: any) {
    console.error('Daily entries error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch daily entries',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

