import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Billing from '@/backend/models/billing.model';
import DriverSalary from '@/backend/models/driver-salary.model';
import Tripsheet from '@/backend/models/tripsheet.model';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import VehicleLoan from '@/backend/models/vehicle-loan.model';
import { calculateBilling } from '@/lib/utils/billing-calculator';
import { calculateDriverSalary } from '@/backend/utils/salary-calculator';
import { TripsheetStatus } from '@/backend/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Force dynamic rendering (uses getServerSession which requires headers)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports/vehicle-profit
 * Get net revenue (profit) per vehicle per month
 * Net Revenue = Billing Amount - Driver Salary - Fuel Expenses
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

    // Get all vehicles
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('vehicleTypeId', 'name code')
      .populate('assignedDriverId', 'name')
      .lean();

    // Get all tripsheets for the month (for billing calculation and fuel expenses)
    // Include all statuses to show data - filter can be adjusted later if needed
    const tripsheets = await Tripsheet.find({
      month,
      year,
      // Include all statuses for now
      // status: { $in: [TripsheetStatus.APPROVED, TripsheetStatus.SUBMITTED] },
    })
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber vehicleTypeId assignedDriverId',
      })
      .lean();

    // Get all vehicle types for billing calculation
    // Map by both _id and name since vehicleTypeId might be stored as either
    const vehicleTypes = await VehicleType.find({ isActive: true }).lean();
    const vehicleTypeMap = new Map<string, any>();
    vehicleTypes.forEach((vt: any) => {
      vehicleTypeMap.set(vt._id.toString(), vt);
      vehicleTypeMap.set(vt.name, vt); // Also map by name in case vehicleTypeId is stored as name
    });

    // Get all billings for the month (for comparison, but we'll calculate from tripsheets)
    const billings = await Billing.find({ month, year }).lean();

    // Get all salaries for the month
    const salaries = await DriverSalary.find({ month, year }).lean();

    // Get all active vehicle loans and calculate EMI for the month
    const activeLoans = await VehicleLoan.find({ isActive: true }).lean();
    const loanEmiByVehicleMap = new Map<string, number>();
    
    for (const loan of activeLoans) {
      const vehicleId = loan.vehicleId.toString();
      
      // Check if there's a payment for this month/year
      const monthPayment = loan.payments?.find((payment: any) => {
        const paymentDate = new Date(payment.emiDate);
        return paymentDate.getMonth() + 1 === month && paymentDate.getFullYear() === year;
      });
      
      // If payment exists, use its amount; otherwise use the loan's EMI amount
      const emiAmount = monthPayment ? monthPayment.amount : loan.emiAmount;
      
      // Add to vehicle's total loan EMI (in case there are multiple loans)
      loanEmiByVehicleMap.set(vehicleId, (loanEmiByVehicleMap.get(vehicleId) || 0) + emiAmount);
    }

    // Create a map to store vehicle-wise data
    const vehicleProfitMap = new Map<string, {
      vehicleId: string;
      vehicleNumber: string;
      vehicleType?: string;
      driverName?: string;
      billingAmount: number;
      driverSalary: number;
      fuelExpenses: number;
      loanEmi: number;
      netRevenue: number;
    }>();

    // Initialize all vehicles
    for (const vehicle of vehicles) {
      const vehicleId = vehicle._id.toString();
      const loanEmi = loanEmiByVehicleMap.get(vehicleId) || 0;
      
      vehicleProfitMap.set(vehicleId, {
        vehicleId,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: (vehicle.vehicleTypeId as any)?.name,
        driverName: (vehicle.assignedDriverId as any)?.name,
        billingAmount: 0,
        driverSalary: 0,
        fuelExpenses: 0,
        loanEmi,
        netRevenue: 0,
      });
    }

    // Create a set of tripsheet IDs that already have bills
    const billedTripsheetIds = new Set(billings.map(b => b.tripsheetId.toString()));

    // Calculate billing amounts per vehicle from tripsheets (or use existing bills if available)
    // This ensures we show revenue even if bills haven't been generated yet
    const billingMap = new Map<string, number>();
    
    // First, add amounts from existing bills
    for (const billing of billings) {
      const vehicleId = billing.vehicleId.toString();
      billingMap.set(vehicleId, (billingMap.get(vehicleId) || 0) + billing.calculation.totalAmount);
    }

    // Then, calculate billing from tripsheets that don't have bills yet
    for (const tripsheet of tripsheets) {
      const tripsheetId = tripsheet._id.toString();
      
      // Skip if this tripsheet already has a bill
      if (billedTripsheetIds.has(tripsheetId)) {
        continue;
      }

      const vehicle = tripsheet.vehicleId as any;
      if (!vehicle || !vehicle._id) {
        continue;
      }
      
      const vehicleId = vehicle._id.toString();
      
      // Get vehicle type - vehicleTypeId is stored as String (name) in Vehicle model
      const vehicleTypeName = vehicle.vehicleTypeId?.toString() || vehicle.vehicleTypeId;
      const vehicleType = vehicleTypeName ? vehicleTypeMap.get(vehicleTypeName) : null;
      
      if (!vehicleType && vehicleTypeName) {
        console.warn(`[Vehicle Profit] Vehicle type "${vehicleTypeName}" not found in map. Available types: ${Array.from(vehicleTypeMap.keys()).filter(k => !k.match(/^[0-9a-f]{24}$/i)).join(', ')}`);
      }

      // Calculate billing from tripsheet if vehicle type is available
      if (vehicleType && vehicleType.billingRules) {
        try {
          if (!tripsheet.summary || tripsheet.summary.totalWorkingDays === undefined) {
            console.warn(`[Vehicle Profit] Tripsheet ${tripsheetId} missing summary data for billing calculation`);
          } else {
            const calculation = calculateBilling(tripsheet as any, vehicleType);
            billingMap.set(vehicleId, (billingMap.get(vehicleId) || 0) + calculation.totalAmount);
            console.log(`[Vehicle Profit] Calculated billing ${calculation.totalAmount} for tripsheet ${tripsheetId} (vehicle: ${vehicleId})`);
          }
        } catch (error: any) {
          console.error(`[Vehicle Profit] Error calculating billing for tripsheet ${tripsheetId}:`, error.message, error.stack);
        }
      } else {
        console.warn(`[Vehicle Profit] Cannot calculate billing for tripsheet ${tripsheetId} - vehicleType: ${!!vehicleType}, billingRules: ${!!(vehicleType?.billingRules)}, vehicleTypeId: ${vehicleTypeName}`);
      }
    }

    // Apply billing amounts to vehicles
    for (const [vehicleId, amount] of billingMap.entries()) {
      if (vehicleProfitMap.has(vehicleId)) {
        vehicleProfitMap.get(vehicleId)!.billingAmount = amount;
      }
    }

    // Calculate driver salaries per vehicle
    // First, add salaries from existing records
    const salaryTripsheetIds = new Set(salaries.map(s => s.tripsheetId.toString()));
    for (const salary of salaries) {
      const vehicleId = salary.vehicleId.toString();
      if (vehicleProfitMap.has(vehicleId)) {
        vehicleProfitMap.get(vehicleId)!.driverSalary += salary.calculation.totalSalary;
      }
    }
    
    // Then, calculate salaries for tripsheets that don't have salary records yet
    for (const tripsheet of tripsheets) {
      try {
        const tripsheetId = tripsheet._id.toString();
        
        // Skip if salary already exists
        if (salaryTripsheetIds.has(tripsheetId)) {
          continue;
        }
        
        const vehicle = tripsheet.vehicleId as any;
        if (!vehicle || !vehicle._id) {
          continue;
        }
        
        const vehicleId = vehicle._id.toString();
        
        // Calculate salary from tripsheet summary if it exists
        if (tripsheet.summary && vehicleProfitMap.has(vehicleId)) {
          try {
            // Ensure summary has required fields
            if (typeof tripsheet.summary.totalWorkingDays === 'number' && 
                typeof tripsheet.summary.totalDriverExtraHours === 'number') {
              const salaryCalculation = calculateDriverSalary(tripsheet.summary);
              vehicleProfitMap.get(vehicleId)!.driverSalary += salaryCalculation.totalSalary;
            } else {
              console.warn(`[Vehicle Profit] Tripsheet ${tripsheetId} summary missing required fields`);
            }
          } catch (error: any) {
            console.error(`[Vehicle Profit] Error calculating salary for tripsheet ${tripsheetId}:`, error.message, error.stack);
          }
        }
      } catch (error: any) {
        console.error(`[Vehicle Profit] Error processing tripsheet for salary:`, error.message);
      }
    }

    // Calculate fuel expenses per vehicle
    for (const tripsheet of tripsheets) {
      try {
        const vehicle = tripsheet.vehicleId as any;
        if (!vehicle || !vehicle._id) {
          continue;
        }
        const vehicleId = vehicle._id.toString();
        if (vehicleProfitMap.has(vehicleId)) {
          vehicleProfitMap.get(vehicleId)!.fuelExpenses += tripsheet.summary?.totalFuelAmount || 0;
        }
      } catch (error: any) {
        console.error(`[Vehicle Profit] Error processing tripsheet for fuel:`, error.message);
      }
    }

    // Calculate net revenue for each vehicle (including loan EMI as expense)
    const vehicleProfits = Array.from(vehicleProfitMap.values()).map(vehicle => {
      vehicle.netRevenue = vehicle.billingAmount - vehicle.driverSalary - vehicle.fuelExpenses - vehicle.loanEmi;
      return vehicle;
    });

    console.log(`[Vehicle Profit] Total vehicles: ${vehicleProfits.length}`);
    console.log(`[Vehicle Profit] Tripsheets found: ${tripsheets.length}`);
    console.log(`[Vehicle Profit] Vehicles with billing: ${vehicleProfits.filter(v => v.billingAmount > 0).length}`);
    console.log(`[Vehicle Profit] Vehicles with salary: ${vehicleProfits.filter(v => v.driverSalary > 0).length}`);
    console.log(`[Vehicle Profit] Vehicles with fuel: ${vehicleProfits.filter(v => v.fuelExpenses > 0).length}`);

    // For debugging: Check which vehicles have tripsheets
    const vehiclesWithTripsheets = new Set(tripsheets.map((ts: any) => (ts.vehicleId as any)?._id?.toString()));
    console.log(`[Vehicle Profit] Vehicles with tripsheets: ${Array.from(vehiclesWithTripsheets).join(', ')}`);
    
    // Filter out vehicles with no data (all zeros)
    // But keep vehicles that have tripsheets even if calculations are zero (for debugging)
    const vehiclesWithData = vehicleProfits.filter(
      (v) => {
        const hasData = v.billingAmount > 0 || v.driverSalary > 0 || v.fuelExpenses > 0;
        if (!hasData && vehiclesWithTripsheets.has(v.vehicleId)) {
          console.warn(`[Vehicle Profit] Vehicle ${v.vehicleNumber} has tripsheet but all values are zero! (billing: ${v.billingAmount}, salary: ${v.driverSalary}, fuel: ${v.fuelExpenses})`);
        }
        return hasData;
      }
    );
    
    console.log(`[Vehicle Profit] Vehicles with data after filter: ${vehiclesWithData.length}`);
    
    // If no vehicles have data but tripsheets exist, log detailed debugging info
    if (vehiclesWithData.length === 0 && tripsheets.length > 0) {
      console.warn(`[Vehicle Profit] No vehicles with data but ${tripsheets.length} tripsheets found.`);
      tripsheets.slice(0, 2).forEach((ts: any, idx: number) => {
        const vehicle = ts.vehicleId as any;
        console.warn(`[Vehicle Profit] Tripsheet ${idx + 1}:`, {
          id: ts._id,
          tripsheetNumber: ts.tripsheetNumber,
          vehicleId: vehicle?._id,
          vehicleNumber: vehicle?.vehicleNumber,
          vehicleTypeId: vehicle?.vehicleTypeId,
          summary: ts.summary,
          status: ts.status,
          hasSummary: !!ts.summary,
          totalWorkingDays: ts.summary?.totalWorkingDays,
          totalKms: ts.summary?.totalKms,
          totalFuelAmount: ts.summary?.totalFuelAmount,
        });
      });
    }

    // Sort by net revenue (highest first)
    vehiclesWithData.sort((a, b) => b.netRevenue - a.netRevenue);

    // Calculate totals
    const totals = {
      totalBillingAmount: vehiclesWithData.reduce((sum, v) => sum + v.billingAmount, 0),
      totalDriverSalary: vehiclesWithData.reduce((sum, v) => sum + v.driverSalary, 0),
      totalFuelExpenses: vehiclesWithData.reduce((sum, v) => sum + v.fuelExpenses, 0),
      totalLoanEmi: vehiclesWithData.reduce((sum, v) => sum + v.loanEmi, 0),
      totalNetRevenue: vehiclesWithData.reduce((sum, v) => sum + v.netRevenue, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        month: MONTH_NAMES[month - 1],
        year,
        vehicles: vehiclesWithData,
        totals,
      },
    });
  } catch (error: any) {
    console.error('[Vehicle Profit] API Error:', error);
    console.error('[Vehicle Profit] Error message:', error.message);
    console.error('[Vehicle Profit] Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate vehicle profit report',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
