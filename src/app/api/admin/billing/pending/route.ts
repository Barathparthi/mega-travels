import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import Billing from '@/backend/models/billing.model';
import { TripsheetStatus } from '@/backend/types';

/**
 * GET /api/admin/billing/pending
 * Get all approved tripsheets that don't have bills yet
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
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : new Date().getMonth() + 1;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();

    // Find all approved tripsheets for the month/year
    const approvedTripsheets = await Tripsheet.find({
      month,
      year,
      status: TripsheetStatus.APPROVED,
    })
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId',
        populate: {
          path: 'vehicleTypeId',
          select: 'name code billingRules'
        }
      })
      .populate({
        path: 'driverId',
        select: 'name email phone'
      })
      .sort({ createdAt: -1 });

    // Get all bills for the month/year
    const existingBills = await Billing.find({ month, year }).select('tripsheetId');
    const billedTripsheetIds = new Set(existingBills.map(bill => bill.tripsheetId.toString()));

    // Filter out tripsheets that already have bills and transform to match expected interface
    const pendingTripsheets = approvedTripsheets
      .filter((tripsheet: any) => !billedTripsheetIds.has(tripsheet._id.toString()))
      .map((tripsheet: any) => ({
        _id: tripsheet._id.toString(),
        tripSheetNumber: tripsheet.tripsheetNumber,
        vehicleId: {
          _id: tripsheet.vehicleId._id.toString(),
          registrationNumber: tripsheet.vehicleId.vehicleNumber || '',
          vehicleModel: tripsheet.vehicleId.description || tripsheet.vehicleId.routeName || '',
        },
        driverId: {
          _id: tripsheet.driverId._id.toString(),
          name: tripsheet.driverId.name || '',
          employeeId: tripsheet.driverId.email || '',
        },
        month: tripsheet.month,
        year: tripsheet.year,
        totalDistance: tripsheet.summary?.totalKms ?? 0,
        status: tripsheet.status,
      }));

    return NextResponse.json({
      success: true,
      data: pendingTripsheets,
      count: pendingTripsheets.length,
      message: `Found ${pendingTripsheets.length} tripsheet(s) pending billing`,
    });
  } catch (error: any) {
    console.error('Pending tripsheets error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch pending tripsheets',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
