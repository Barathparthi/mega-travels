import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Billing from '@/backend/models/billing.model';
import Tripsheet from '@/backend/models/tripsheet.model';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import { calculateBilling } from '@/lib/utils/billing-calculator';
import { TripsheetStatus } from '@/backend/types';

/**
 * GET /api/admin/billing
 * List all bills with filters
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
    const status = searchParams.get('status') || 'all';
    const vehicleId = searchParams.get('vehicleId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = { month, year };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (vehicleId) {
      query.vehicleId = vehicleId;
    }

    // Get total count for pagination
    const total = await Billing.countDocuments(query);

    // Fetch bills with pagination and populate
    // Note: vehicleTypeId in Vehicle is a string (name), not ObjectId, so can't be nested populated
    const bills = await Billing.find(query)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId'
      })
      .populate({
        path: 'driverId',
        select: 'name email phone'
      })
      .populate({
        path: 'tripsheetId',
        select: 'tripsheetNumber status'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Calculate stats for all bills in the month/year (not just paginated results)
    const allBills = await Billing.find({ month, year });
    const billsTotalAmount = allBills.reduce((sum: number, b: any) => {
      const amount = b.calculation?.totalAmount || 0;
      return sum + amount;
    }, 0);

    // Calculate total revenue from all approved tripsheets for the month (even if bills not generated)
    const allTripsheets = await Tripsheet.find({
      month,
      year,
      status: TripsheetStatus.APPROVED,
    })
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber vehicleTypeId',
      })
      .lean();

    // Get all unique vehicle type names
    const vehicleTypeNames = new Set<string>();
    allTripsheets.forEach((ts: any) => {
      if (ts.vehicleId && ts.vehicleId.vehicleTypeId && typeof ts.vehicleId.vehicleTypeId === 'string') {
        vehicleTypeNames.add(ts.vehicleId.vehicleTypeId);
      }
    });

    // Fetch all vehicle types
    const vehicleTypes = await VehicleType.find({
      name: { $in: Array.from(vehicleTypeNames) }
    }).select('name code billingRules').lean();

    // Create a map for quick lookup
    const vehicleTypeMap = new Map(vehicleTypes.map((vt: any) => [vt.name, vt]));

    // Calculate total revenue from all tripsheets and create vehicle-wise breakdown
    let totalTripsheetRevenue = 0;
    const vehicleBreakdown = new Map<string, { vehicleNumber: string; amount: number }>();

    for (const tripsheet of allTripsheets) {
      const vehicle: any = tripsheet.vehicleId;
      if (vehicle && vehicle.vehicleTypeId && vehicle.vehicleNumber) {
        const vehicleType = vehicleTypeMap.get(vehicle.vehicleTypeId);
        if (vehicleType) {
          try {
            const billingCalculation = calculateBilling(tripsheet as any, vehicleType);
            const amount = billingCalculation.totalAmount || 0;
            totalTripsheetRevenue += amount;

            // Add to vehicle breakdown
            const vehicleId = vehicle._id.toString();
            if (vehicleBreakdown.has(vehicleId)) {
              vehicleBreakdown.get(vehicleId)!.amount += amount;
            } else {
              vehicleBreakdown.set(vehicleId, {
                vehicleNumber: vehicle.vehicleNumber,
                amount: amount,
              });
            }
          } catch (error) {
            console.error(`Error calculating billing for tripsheet ${tripsheet._id}:`, error);
          }
        }
      }
    }

    // Convert vehicle breakdown map to array and sort by vehicle number
    const vehicleBreakdownArray = Array.from(vehicleBreakdown.values())
      .sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));

    const stats = {
      total: allBills.length,
      generated: allBills.filter((b: any) => b.status === 'generated').length,
      sent: allBills.filter((b: any) => b.status === 'sent').length,
      paid: allBills.filter((b: any) => b.status === 'paid').length,
      totalAmount: billsTotalAmount, // Total from generated bills
      totalTripsheetRevenue: totalTripsheetRevenue, // Total revenue from all approved tripsheets
      totalTripsheets: allTripsheets.length,
      vehicleBreakdown: vehicleBreakdownArray, // Vehicle-wise breakdown
    };

    return NextResponse.json({
      success: true,
      data: bills,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error: any) {
    console.error('Admin billing list error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch bills',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/billing
 * Generate bill for a specific tripsheet
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { tripsheetId } = body;

    if (!tripsheetId) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet ID is required' },
        { status: 400 }
      );
    }

    // Check if bill already exists for this tripsheet
    const existingBill = await Billing.findOne({ tripsheetId });
    if (existingBill) {
      return NextResponse.json(
        { success: false, message: 'Bill already exists for this tripsheet' },
        { status: 400 }
      );
    }

    // Fetch tripsheet with populated vehicle
    const tripsheet = await Tripsheet.findById(tripsheetId)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId'
      });

    if (!tripsheet) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet not found' },
        { status: 404 }
      );
    }

    // Check if tripsheet is approved
    if (tripsheet.status !== TripsheetStatus.APPROVED) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet must be approved before generating bill' },
        { status: 400 }
      );
    }

    // Get vehicle and manually fetch vehicleType since vehicleTypeId is a string (name), not ObjectId
    const vehicle = tripsheet.vehicleId as any;
    let vehicleType: any = null;
    if (vehicle && vehicle.vehicleTypeId) {
      vehicleType = await VehicleType.findOne({ 
        name: vehicle.vehicleTypeId 
      }).select('name code billingRules').lean();
    }

    if (!vehicleType || !vehicleType.billingRules) {
      return NextResponse.json(
        { success: false, message: 'Vehicle type or billing rules not found' },
        { status: 400 }
      );
    }

    // Calculate billing using the billing calculator
    const calculation = calculateBilling(tripsheet, vehicleType);

    // Generate bill number
    const billNumber = await Billing.generateBillNumber(tripsheet.year);

    // Create new bill
    const bill = new Billing({
      billNumber,
      tripsheetId: tripsheet._id,
      vehicleId: vehicle._id,
      driverId: tripsheet.driverId,
      vehicleTypeId: vehicleType._id,
      month: tripsheet.month,
      year: tripsheet.year,
      calculation,
      status: 'generated',
    });

    await bill.save();

    // Populate the bill before returning
    await bill.populate([
      {
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId',
        populate: {
          path: 'vehicleTypeId',
          select: 'name code'
        }
      },
      {
        path: 'driverId',
        select: 'name email phone'
      },
      {
        path: 'tripsheetId',
        select: 'tripsheetNumber status'
      }
    ]);

    return NextResponse.json(
      {
        success: true,
        data: bill,
        message: 'Bill generated successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Bill generation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate bill',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
