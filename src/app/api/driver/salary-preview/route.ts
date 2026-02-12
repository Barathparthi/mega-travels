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

    const tripsheet = await Tripsheet.findOne({
      vehicleId: driver.assignedVehicleId,
      month,
      year,
    }).lean();

    if (!tripsheet) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet not found' },
        { status: 404 }
      );
    }

    // Calculate salary
    const BASE_SALARY = 20000;
    const BASE_DAYS = 22;
    const EXTRA_DAY_RATE = 909;
    const EXTRA_HOUR_RATE = 80;

    const totalWorkingDays = tripsheet.summary.totalWorkingDays;
    const totalDriverExtraHours = tripsheet.summary.totalDriverExtraHours;

    const extraDays = Math.max(0, totalWorkingDays - BASE_DAYS);
    const extraDaysAmount = extraDays * EXTRA_DAY_RATE;
    const extraHoursAmount = totalDriverExtraHours * EXTRA_HOUR_RATE;
    const totalSalary = BASE_SALARY + extraDaysAmount + extraHoursAmount;

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        baseSalary: BASE_SALARY,
        baseDays: BASE_DAYS,
        totalWorkingDays,
        extraDays,
        extraDayRate: EXTRA_DAY_RATE,
        extraDaysAmount,
        totalDriverExtraHours,
        extraHourRate: EXTRA_HOUR_RATE,
        extraHoursAmount,
        totalSalary,
        status: tripsheet.status,
      },
    });
  } catch (error) {
    console.error('Salary preview error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
