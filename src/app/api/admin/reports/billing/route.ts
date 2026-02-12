import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Billing from '@/backend/models/billing.model';
import Tripsheet from '@/backend/models/tripsheet.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import { TripsheetStatus } from '@/backend/types';
import type { IBillingBreakdown } from '@/backend/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Force dynamic rendering (uses getServerSession which requires headers)
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports/billing
 * Get detailed billing breakdown report
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

    // Get all billings for the month
    const billings = await Billing.find({ month, year })
      .populate('vehicleTypeId')
      .lean();

    // Get all approved tripsheets for the month (to calculate revenue even if bills not generated)
    const tripsheets = await Tripsheet.find({
      month,
      year,
      status: TripsheetStatus.APPROVED,
    })
    .populate('vehicleId', 'vehicleTypeId')
    .lean();

    // Calculate total amount from tripsheets (not just bills)
    let totalAmount = 0;
    let componentBreakdownFromTripsheets = {
      baseFare: 0,
      kmCharges: 0,
      driverBata: 0,
      nightHalt: 0,
      additionalHours: 0,
      additionalKms: 0,
    };
    const vehicleTypeRevenueMap = new Map<string, { name: string; amount: number }>();

    if (tripsheets.length > 0) {
      // Get all unique vehicle type names
      const vehicleTypeNames = new Set<string>();
      tripsheets.forEach((trip: any) => {
        const vehicle = trip.vehicleId;
        if (vehicle && vehicle.vehicleTypeId && typeof vehicle.vehicleTypeId === 'string') {
          vehicleTypeNames.add(vehicle.vehicleTypeId);
        }
      });

      if (vehicleTypeNames.size > 0) {
        // Fetch all vehicle types at once
        const allVehicleTypes = await VehicleType.find({
          name: { $in: Array.from(vehicleTypeNames) }
        }).select('name code billingRules _id').lean();
        
        const vehicleTypeMap = new Map(allVehicleTypes.map((vt: any) => [vt.name, vt]));

        // Import billing calculator
        const { calculateBilling } = await import('@/lib/utils/billing-calculator');

        // Calculate revenue for each tripsheet (single loop for both total and breakdown)
        for (const tripsheet of tripsheets) {
          const vehicle: any = tripsheet.vehicleId;
          if (vehicle && vehicle.vehicleTypeId) {
            const vehicleType = vehicleTypeMap.get(vehicle.vehicleTypeId);
            if (vehicleType && vehicleType.billingRules) {
              try {
                const billingCalculation = calculateBilling(tripsheet as any, vehicleType);
                const amount = billingCalculation.totalAmount || 0;
                totalAmount += amount;
                
                // Accumulate component breakdown
                componentBreakdownFromTripsheets.baseFare += billingCalculation.baseAmount || 0;
                componentBreakdownFromTripsheets.kmCharges += billingCalculation.extraKmsAmount || 0;
                componentBreakdownFromTripsheets.additionalHours += billingCalculation.extraHoursAmount || 0;
                componentBreakdownFromTripsheets.additionalKms += billingCalculation.extraKmsAmount || 0;

                // Build vehicle type revenue map
                const key = vehicleType._id?.toString() || vehicleType.name;
                if (!vehicleTypeRevenueMap.has(key)) {
                  vehicleTypeRevenueMap.set(key, {
                    name: vehicleType.name,
                    amount: 0,
                  });
                }
                vehicleTypeRevenueMap.get(key)!.amount += amount;
              } catch (error) {
                console.error(`Error calculating billing for tripsheet ${tripsheet._id}:`, error);
              }
            }
          }
        }
      }
    }

    // Component breakdown (use tripsheet calculations as primary source)
    const componentBreakdown = {
      baseFare: componentBreakdownFromTripsheets.baseFare,
      kmCharges: componentBreakdownFromTripsheets.kmCharges,
      driverBata: 0, // Not tracked in current model
      nightHalt: 0, // Not tracked in current model
      additionalHours: componentBreakdownFromTripsheets.additionalHours,
      additionalKms: componentBreakdownFromTripsheets.additionalKms,
    };

    // Vehicle type breakdown is already calculated above in the same loop

    const byVehicleType = Array.from(vehicleTypeRevenueMap.values()).map(vt => ({
      vehicleType: vt.name,
      amount: vt.amount,
      percentage: totalAmount > 0 ? (vt.amount / totalAmount) * 100 : 0,
    }));

    // Payment status based on BillingStatus
    // For tripsheets without bills, consider them as pending
    const billsTotal = billings.reduce((sum, b) => sum + (b.calculation?.totalAmount || 0), 0);
    const pendingFromTripsheets = totalAmount - billsTotal;
    
    const paymentStatus = {
      paid: billings.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.calculation?.totalAmount || 0), 0),
      pending: billings.filter(b => b.status === 'generated' || b.status === 'sent').reduce((sum, b) => sum + (b.calculation?.totalAmount || 0), 0) + pendingFromTripsheets,
      overdue: 0, // Could be calculated based on sentAt date
    };

    const report: IBillingBreakdown = {
      month: MONTH_NAMES[month - 1],
      year,
      totalAmount,
      componentBreakdown,
      byVehicleType,
      paymentStatus,
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('Billing report error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate billing report',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
