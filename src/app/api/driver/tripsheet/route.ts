import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/connection';
import User from '@/backend/models/user.model';
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

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (!month || !year) {
      return NextResponse.json(
        { success: false, message: 'Month and year are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const driver = await User.findById(session.user.id);

    if (!driver) {
      return NextResponse.json(
        { success: false, message: 'Driver not found' },
        { status: 404 }
      );
    }

    if (!driver.assignedVehicleId) {
      return NextResponse.json(
        { success: false, message: 'No vehicle assigned to this driver. Please contact admin.' },
        { status: 400 }
      );
    }

    let tripsheet = await Tripsheet.findOne({
      vehicleId: driver.assignedVehicleId,
      month,
      year,
    }).populate('vehicleId', 'vehicleNumber driverPassengers routeName');

    // Initialize tripsheet if doesn't exist
    if (!tripsheet) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const entries = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
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
        month,
        year,
        entries,
        status: 'draft',
      });
    } else {
      // Ensure all days of the month exist in entries (fix for tripsheets created mid-month)
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Create a set of existing entry days for quick lookup
      // Handle dates carefully to avoid timezone issues
      const existingDays = new Set<number>();
      tripsheet.entries.forEach((e: any) => {
        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
        // Use UTC methods or local date methods consistently
        // Create a date at midnight local time for comparison
        const entryYear = entryDate.getFullYear();
        const entryMonth = entryDate.getMonth() + 1;
        const entryDay = entryDate.getDate();
        
        // Check if entry is in the same month/year
        if (entryYear === year && entryMonth === month) {
          existingDays.add(entryDay);
        }
      });

      let needsUpdate = false;
      const entriesToAdd: any[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        if (!existingDays.has(day)) {
          // Create date at local midnight to avoid timezone issues
          const date = new Date(year, month - 1, day, 12, 0, 0, 0); // Use noon to avoid DST issues
          entriesToAdd.push({
            date,
            dayOfWeek: getDayName(date),
            dayType: getDayType(date),
            status: 'pending',
          });
          needsUpdate = true;
        }
      }

      // Add missing entries if any
      if (needsUpdate && entriesToAdd.length > 0) {
        console.log(`Adding ${entriesToAdd.length} missing entries for month ${month}/${year}`);
        tripsheet.entries.push(...entriesToAdd);
        // Sort entries by date to keep them in order
        tripsheet.entries.sort((a: any, b: any) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });
        // Mark entries as modified to trigger pre-save hook for summary recalculation
        tripsheet.markModified('entries');
        tripsheet.markModified('summary'); // Force summary recalculation
        await tripsheet.save();
        // Reload to get updated summary
        tripsheet = await Tripsheet.findOne({
          vehicleId: driver.assignedVehicleId,
          month,
          year,
        }).populate('vehicleId', 'vehicleNumber driverPassengers routeName');
        console.log(`Tripsheet updated: Total entries now ${tripsheet.entries.length}, Summary: ${JSON.stringify(tripsheet.summary)}`);
      }
    }

    // Always recalculate summary to ensure it's correct (fixes outdated summaries)
    // This ensures the new calculation logic (counting all working entries regardless of dayType) is applied
    const actualWorkingCount = tripsheet.entries.filter((e: any) => e.status === 'working').length;
    const actualOffCount = tripsheet.entries.filter((e: any) => e.status === 'off').length;
    const actualPendingCount = tripsheet.entries.filter((e: any) => e.status === 'pending').length;
    
    // Force recalculation if there's any mismatch (detects outdated summaries from old calculation logic)
    if (
      tripsheet.summary.totalWorkingDays !== actualWorkingCount ||
      tripsheet.summary.totalOffDays !== actualOffCount ||
      tripsheet.summary.totalPendingDays !== actualPendingCount
    ) {
      console.log(`Summary mismatch detected. Recalculating...`);
      console.log(`  Actual counts: ${actualWorkingCount} working, ${actualOffCount} off, ${actualPendingCount} pending`);
      console.log(`  Stored summary: ${tripsheet.summary.totalWorkingDays} working, ${tripsheet.summary.totalOffDays} off, ${tripsheet.summary.totalPendingDays} pending`);
      
      // Force save to trigger pre-save hook which recalculates summary
      tripsheet.markModified('entries');
      tripsheet.markModified('summary');
      await tripsheet.save();
      
      // Reload to get updated summary
      tripsheet = await Tripsheet.findOne({
        vehicleId: driver.assignedVehicleId,
        month,
        year,
      }).populate('vehicleId', 'vehicleNumber driverPassengers routeName');
      
      console.log(`  Updated summary: ${tripsheet.summary.totalWorkingDays} working, ${tripsheet.summary.totalOffDays} off, ${tripsheet.summary.totalPendingDays} pending`);
    }

    // Convert to plain object for response
    const tripsheetData = tripsheet.toObject ? tripsheet.toObject() : tripsheet;
    
    // Populate vehicleId if it's still an ObjectId
    if (tripsheetData.vehicleId && typeof tripsheetData.vehicleId === 'object') {
      // Already populated, keep as is
    }

    // Add serial numbers to working entries
    let serialNumber = 1;
    const entriesWithSerialNumbers = tripsheetData.entries.map((entry: any) => {
      if (entry.status === 'working') {
        return { ...entry, serialNumber: serialNumber++ };
      }
      return entry;
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tripsheetData,
        entries: entriesWithSerialNumbers,
      },
    });
  } catch (error) {
    console.error('Get tripsheet error:', error);
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
    const { month, year } = body;

    await dbConnect();

    const driver = await User.findById(session.user.id);

    // Check if tripsheet exists - use vehicleId to match unique compound index
    if (!driver.assignedVehicleId) {
      return NextResponse.json(
        { success: false, message: 'No vehicle assigned to this driver. Please contact admin.' },
        { status: 400 }
      );
    }

    let tripsheet = await Tripsheet.findOne({
      vehicleId: driver.assignedVehicleId,
      month,
      year,
    });

    if (tripsheet) {
      return NextResponse.json({
        success: true,
        data: tripsheet,
        message: 'Tripsheet already exists',
      });
    }

    // Create new tripsheet
    const daysInMonth = new Date(year, month, 0).getDate();
    const entries = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
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
      month,
      year,
      entries,
      status: 'draft',
    });

    return NextResponse.json({
      success: true,
      data: tripsheet,
      message: 'Tripsheet initialized successfully',
    });
  } catch (error) {
    console.error('Create tripsheet error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
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
