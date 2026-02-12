import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Vehicle from '@/backend/models/vehicle.model';
import User from '@/backend/models/user.model';
import Tripsheet from '@/backend/models/tripsheet.model';
import Billing from '@/backend/models/billing.model';
import { VehicleStatus, UserRole, TripsheetStatus } from '@/backend/types';

/**
 * GET /api/admin/stats
 * Get dashboard statistics
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

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Calculate previous month for comparison
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get vehicle counts
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ status: VehicleStatus.ACTIVE });

    // Get driver counts
    const totalDrivers = await User.countDocuments({ role: UserRole.DRIVER });
    const activeDrivers = await User.countDocuments({ 
      role: UserRole.DRIVER, 
      isActive: true 
    });

    // Get pending tripsheets
    const pendingTripsheets = await Tripsheet.countDocuments({ status: TripsheetStatus.SUBMITTED });

    // Calculate current month revenue from all approved tripsheets
    // This ensures revenue is shown even before bills are generated
    const currentMonthTripsheets = await Tripsheet.find({ 
      month: currentMonth, 
      year: currentYear,
      status: TripsheetStatus.APPROVED
    })
    .populate('vehicleId', 'vehicleTypeId')
    .lean();

    let currentMonthRevenue = 0;
    if (currentMonthTripsheets.length > 0) {
      // Get all unique vehicle types
      const VehicleType = (await import('@/backend/models/vehicle-type.model')).default;
      const vehicleTypeNames = [...new Set(
        currentMonthTripsheets
          .map((t: any) => t.vehicleId?.vehicleTypeId)
          .filter(Boolean)
      )];
      
      const vehicleTypes = await VehicleType.find({ 
        name: { $in: vehicleTypeNames } 
      }).select('name code billingRules').lean();
      
      const vehicleTypeMap = new Map(vehicleTypes.map((vt: any) => [vt.name, vt]));
      
      // Import billing calculator
      const { calculateBilling } = await import('@/lib/utils/billing-calculator');
      
      for (const tripsheet of currentMonthTripsheets) {
        const vehicle: any = tripsheet.vehicleId;
        if (vehicle && vehicle.vehicleTypeId) {
          const vehicleType = vehicleTypeMap.get(vehicle.vehicleTypeId);
          if (vehicleType) {
            try {
              const billingCalculation = calculateBilling(tripsheet as any, vehicleType);
              currentMonthRevenue += billingCalculation.totalAmount || 0;
            } catch (error) {
              console.error(`Error calculating billing for tripsheet ${tripsheet._id}:`, error);
            }
          }
        }
      }
    }

    // Calculate previous month revenue from approved tripsheets
    const previousMonthTripsheets = await Tripsheet.find({ 
      month: previousMonth, 
      year: previousYear,
      status: TripsheetStatus.APPROVED
    })
    .populate('vehicleId', 'vehicleTypeId')
    .lean();

    let previousMonthRevenue = 0;
    if (previousMonthTripsheets.length > 0) {
      const VehicleType = (await import('@/backend/models/vehicle-type.model')).default;
      const vehicleTypeNames = [...new Set(
        previousMonthTripsheets
          .map((t: any) => t.vehicleId?.vehicleTypeId)
          .filter(Boolean)
      )];
      
      const vehicleTypes = await VehicleType.find({ 
        name: { $in: vehicleTypeNames } 
      }).select('name code billingRules').lean();
      
      const vehicleTypeMap = new Map(vehicleTypes.map((vt: any) => [vt.name, vt]));
      const { calculateBilling } = await import('@/lib/utils/billing-calculator');
      
      for (const tripsheet of previousMonthTripsheets) {
        const vehicle: any = tripsheet.vehicleId;
        if (vehicle && vehicle.vehicleTypeId) {
          const vehicleType = vehicleTypeMap.get(vehicle.vehicleTypeId);
          if (vehicleType) {
            try {
              const billingCalculation = calculateBilling(tripsheet as any, vehicleType);
              previousMonthRevenue += billingCalculation.totalAmount || 0;
            } catch (error) {
              console.error(`Error calculating billing for tripsheet ${tripsheet._id}:`, error);
            }
          }
        }
      }
    }

    // Calculate revenue change percentage
    const revenueChange = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : (currentMonthRevenue > 0 ? 100 : 0);

    // Get vehicle type breakdown (count of vehicles by type)
    const vehicles = await Vehicle.find({ status: VehicleStatus.ACTIVE }).select('vehicleTypeId').lean();
    const vehicleTypeBreakdown: Record<string, number> = {};
    
    for (const vehicle of vehicles) {
      const vehicleTypeName = vehicle.vehicleTypeId?.toString() || 'Unknown';
      vehicleTypeBreakdown[vehicleTypeName] = (vehicleTypeBreakdown[vehicleTypeName] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalVehicles,
        activeVehicles,
        totalDrivers,
        activeDrivers,
        pendingTripsheets,
        currentMonthRevenue,
        previousMonthRevenue,
        revenueChange: Math.round(revenueChange * 10) / 10, // Round to 1 decimal place
        vehicleTypeBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

