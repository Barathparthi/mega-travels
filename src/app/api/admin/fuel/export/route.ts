import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import {
  IVehicleFuelSummary,
  IFuelSummaryStats,
  VehicleTypeCode,
} from '@/backend/types';
import { getMileageHealth, getMileageTrend } from '@/lib/utils/fuel-constants';
import { generateFuelReportExcel } from '@/lib/utils/fuel-export';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * GET /api/admin/fuel/export
 * Export fuel report to Excel
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

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const vehicleIdFilter = searchParams.get('vehicleId');

    // Build query for tripsheets
    const query: any = {
      month,
      year,
      status: 'approved',
    };

    if (vehicleIdFilter && vehicleIdFilter !== 'all') {
      query.vehicleId = vehicleIdFilter;
    }

    // Get all approved tripsheets for the period
    const tripsheets = await Tripsheet.find(query)
      .populate('vehicleId')
      .populate('driverId')
      .lean();

    // Group fuel data by vehicle
    const vehicleMap = new Map<string, any>();

    for (const tripsheet of tripsheets) {
      const vehicle = tripsheet.vehicleId as any;
      const driver = tripsheet.driverId as any;
      const vehicleId = vehicle._id.toString();

      if (!vehicleMap.has(vehicleId)) {
        vehicleMap.set(vehicleId, {
          vehicleId: vehicle._id,
          vehicleNumber: vehicle.vehicleNumber,
          vehicleType: vehicle.vehicleTypeId,
          driverName: driver.name,
          totalKm: 0,
          totalLitres: 0,
          totalAmount: 0,
        });
      }

      const vehicleData = vehicleMap.get(vehicleId);
      vehicleData.totalKm += tripsheet.summary.totalKms || 0;
      vehicleData.totalLitres += tripsheet.summary.totalFuelLitres || 0;
      vehicleData.totalAmount += tripsheet.summary.totalFuelAmount || 0;
    }

    // Populate vehicle types and calculate metrics
    const vehicleSummaries: IVehicleFuelSummary[] = [];

    for (const [vehicleId, data] of Array.from(vehicleMap.entries())) {
      const vehicleType = await VehicleType.findById(data.vehicleType).lean();
      if (!vehicleType) continue;

      const averageMileage =
        data.totalLitres > 0 ? data.totalKm / data.totalLitres : 0;
      const averageRatePerLitre =
        data.totalLitres > 0 ? data.totalAmount / data.totalLitres : 0;

      // Get previous month data for trend
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      const prevTripsheet = await Tripsheet.findOne({
        vehicleId: data.vehicleId,
        month: prevMonth,
        year: prevYear,
        status: 'approved',
      }).lean();

      let previousMileage = 0;
      if (prevTripsheet) {
        const prevLitres = prevTripsheet.summary.totalFuelLitres || 0;
        const prevKms = prevTripsheet.summary.totalKms || 0;
        previousMileage = prevLitres > 0 ? prevKms / prevLitres : 0;
      }

      const trend = getMileageTrend(averageMileage, previousMileage);
      const mileageHealth = getMileageHealth(
        vehicleType.code as VehicleTypeCode,
        averageMileage
      );

      vehicleSummaries.push({
        vehicleId: vehicleId,
        vehicleNumber: data.vehicleNumber,
        vehicleType: vehicleType.name,
        vehicleTypeCode: vehicleType.code as VehicleTypeCode,
        driverName: data.driverName,
        totalKm: data.totalKm,
        totalLitres: data.totalLitres,
        totalAmount: data.totalAmount,
        averageMileage,
        averageRatePerLitre,
        trend,
        mileageHealth,
      });
    }

    // Calculate overall stats
    const stats: IFuelSummaryStats = {
      totalLitres: vehicleSummaries.reduce((sum, v) => sum + v.totalLitres, 0),
      totalAmount: vehicleSummaries.reduce((sum, v) => sum + v.totalAmount, 0),
      averageRatePerLitre: 0,
      averageMileage: 0,
      vehicleCount: vehicleSummaries.length,
    };

    if (stats.totalLitres > 0) {
      stats.averageRatePerLitre = stats.totalAmount / stats.totalLitres;
      const totalKm = vehicleSummaries.reduce((sum, v) => sum + v.totalKm, 0);
      stats.averageMileage = totalKm / stats.totalLitres;
    }

    // Generate Excel
    const buffer = await generateFuelReportExcel(
      vehicleSummaries,
      stats,
      month,
      year
    );

    // Create filename
    const filename = `Fuel_Report_${MONTH_NAMES[month - 1]}_${year}.xlsx`;

    // Return Excel file
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Fuel export error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate fuel report',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
