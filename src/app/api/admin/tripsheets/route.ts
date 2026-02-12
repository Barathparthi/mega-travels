import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import type { ITripsheetStats } from '@/backend/types';

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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = { month, year };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Only filter by vehicle when a real vehicleId is provided
    if (vehicleId && vehicleId !== 'skip' && vehicleId !== 'all') {
      query.vehicleId = vehicleId;
    }

    // Get total count for pagination
    const total = await Tripsheet.countDocuments(query);

    // Fetch tripsheets with pagination
    // For proper sorting: we need to fetch all matching tripsheets, sort them, then paginate
    // This ensures submitted tripsheets appear first regardless of pagination
    let tripsheetsQuery = Tripsheet.find(query)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId'
      })
      .populate({
        path: 'driverId',
        select: 'name email phone'
      })
      .lean(); // Convert to plain objects for better JSON serialization

    let allTripsheets = await tripsheetsQuery.exec();

    // Sort tripsheets: submitted first (by submittedAt desc), then draft/pending (by createdAt desc)
    allTripsheets.sort((a: any, b: any) => {
      // If both are submitted, sort by submittedAt (newest first)
      if (a.status === 'submitted' && b.status === 'submitted') {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return bTime - aTime;
      }
      // If only a is submitted, a comes first
      if (a.status === 'submitted' && b.status !== 'submitted') {
        return -1;
      }
      // If only b is submitted, b comes first
      if (a.status !== 'submitted' && b.status === 'submitted') {
        return 1;
      }
      // Both are not submitted, sort by createdAt (newest first)
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    // Apply pagination after sorting
    const startIndex = (page - 1) * limit;
    let tripsheets = allTripsheets.slice(startIndex, startIndex + limit);

    // Filter by driver name if search is provided (before populating vehicle types)
    if (search && search.trim()) {
      tripsheets = tripsheets.filter((ts: any) => {
        return ts.driverId?.name?.toLowerCase().includes(search.toLowerCase());
      });
    }

    // Manually populate vehicle types since vehicleTypeId is a string (name), not ObjectId
    // Collect all unique vehicle type names
    const vehicleTypeNames = new Set<string>();
    tripsheets.forEach((ts: any) => {
      if (ts.vehicleId && ts.vehicleId.vehicleTypeId && typeof ts.vehicleId.vehicleTypeId === 'string') {
        vehicleTypeNames.add(ts.vehicleId.vehicleTypeId);
      }
    });

    // Fetch all vehicle types in one query
    const vehicleTypes = await VehicleType.find({
      name: { $in: Array.from(vehicleTypeNames) }
    }).select('name code').lean();

    // Create a map for quick lookup
    const vehicleTypeMap = new Map(vehicleTypes.map((vt: any) => [vt.name, vt]));

    // Map vehicle types to tripsheets
    tripsheets.forEach((ts: any) => {
      if (ts.vehicleId && ts.vehicleId.vehicleTypeId && typeof ts.vehicleId.vehicleTypeId === 'string') {
        ts.vehicleId.vehicleTypeId = vehicleTypeMap.get(ts.vehicleId.vehicleTypeId) || null;
      }
    });

    // Calculate stats for the month/year
    const statsTripsheets = await Tripsheet.find({ month, year });
    const stats: ITripsheetStats = {
      total: statsTripsheets.length,
      draft: statsTripsheets.filter((ts: any) => ts.status === 'draft').length,
      submitted: statsTripsheets.filter((ts: any) => ts.status === 'submitted').length,
      approved: statsTripsheets.filter((ts: any) => ts.status === 'approved').length,
    };

    return NextResponse.json({
      success: true,
      data: tripsheets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error: any) {
    console.error('Admin tripsheets error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch tripsheets',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
