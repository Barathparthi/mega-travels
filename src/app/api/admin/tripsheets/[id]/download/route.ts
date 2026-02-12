import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Tripsheet from '@/backend/models/tripsheet.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import { generateTripsheetExcel, getMonthName } from '@/lib/utils/excel-export';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const tripsheetId = params.id;
    if (!tripsheetId) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet ID is required' },
        { status: 400 }
      );
    }

    const tripsheet = await Tripsheet.findById(tripsheetId)
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName vehicleTypeId'
      })
      .populate({
        path: 'driverId',
        select: 'name email phone'
      });

    if (!tripsheet) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet not found' },
        { status: 404 }
      );
    }

    const vehicle: any = tripsheet.vehicleId;
    const driver: any = tripsheet.driverId;

    // Validate required data
    if (!vehicle || !driver) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet data is incomplete - missing vehicle or driver' },
        { status: 400 }
      );
    }

    // Handle vehicleTypeId - it's stored as a string (name), not ObjectId
    let finalVehicleType: any = null;
    const vehicleTypeIdValue = vehicle?.vehicleTypeId;
    let vehicleTypeName: string = 'Vehicle';

    // Extract vehicle type name if it's a string
    if (vehicleTypeIdValue) {
      if (typeof vehicleTypeIdValue === 'string') {
        vehicleTypeName = vehicleTypeIdValue;
      } else if (typeof vehicleTypeIdValue === 'object' && vehicleTypeIdValue !== null) {
        vehicleTypeName = vehicleTypeIdValue.name || vehicleTypeIdValue.code || 'Vehicle';
      }
    }

    // Always fetch VehicleType by name to ensure we have the correct object
    if (vehicleTypeName && vehicleTypeName !== 'Vehicle') {
      const fetchedVehicleType = await VehicleType.findOne({ name: vehicleTypeName })
        .select('name code billingRules')
        .lean();
      if (fetchedVehicleType) {
        finalVehicleType = fetchedVehicleType;
      }
    }

    // If still no vehicleType, create a default one with billing rules
    if (!finalVehicleType || typeof finalVehicleType !== 'object') {
      finalVehicleType = {
        name: vehicleTypeName,
        code: 'VEH',
        billingRules: {
          baseAmount: 55000,
          baseDays: 22,
          extraDayRate: 2500,
          extraKmRate: 10,
          baseHoursPerDay: 10,
          extraHourRate: 100,
        }
      };
    } else {
      // Ensure finalVehicleType is a plain object (not a Mongoose document)
      // Since we used .lean(), it should already be a plain object, but double-check
      if (finalVehicleType.toObject && typeof finalVehicleType.toObject === 'function') {
        finalVehicleType = finalVehicleType.toObject();
      }
      
      // Ensure billingRules exists and is an object
      if (!finalVehicleType.billingRules || typeof finalVehicleType.billingRules !== 'object' || Array.isArray(finalVehicleType.billingRules)) {
        finalVehicleType.billingRules = {
          baseAmount: finalVehicleType.billingRules?.baseAmount || 55000,
          baseDays: finalVehicleType.billingRules?.baseDays || 22,
          extraDayRate: finalVehicleType.billingRules?.extraDayRate || 2500,
          extraKmRate: finalVehicleType.billingRules?.extraKmRate || 10,
          baseHoursPerDay: finalVehicleType.billingRules?.baseHoursPerDay || 10,
          extraHourRate: finalVehicleType.billingRules?.extraHourRate || 100,
        };
      }
    }

    // Final safety check: ensure finalVehicleType is always an object before passing to Excel generation
    if (typeof finalVehicleType !== 'object' || finalVehicleType === null || Array.isArray(finalVehicleType)) {
      console.error('Invalid finalVehicleType:', typeof finalVehicleType, finalVehicleType);
      finalVehicleType = {
        name: vehicleTypeName,
        code: 'VEH',
        billingRules: {
          baseAmount: 55000,
          baseDays: 22,
          extraDayRate: 2500,
          extraKmRate: 10,
          baseHoursPerDay: 10,
          extraHourRate: 100,
        }
      };
    }

    // Validate entries exist
    if (!tripsheet.entries || !Array.isArray(tripsheet.entries) || tripsheet.entries.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tripsheet has no entries to export' },
        { status: 400 }
      );
    }

    // Generate Excel
    let buffer;
    try {
      buffer = await generateTripsheetExcel(
        tripsheet as any,
        vehicle,
        driver,
        finalVehicleType
      );
    } catch (excelError: any) {
      console.error('Excel generation error:', excelError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate Excel file',
          error: excelError.message || 'Unknown error during Excel generation',
          details: excelError.stack,
        },
        { status: 500 }
      );
    }

    if (!buffer) {
      return NextResponse.json(
        { success: false, message: 'Failed to generate Excel buffer - buffer is null' },
        { status: 500 }
      );
    }

    // Create filename
    const filename = `Tripsheet_${vehicle.vehicleNumber.replace(/\s+/g, '_')}_${getMonthName(tripsheet.month)}_${tripsheet.year}.xlsx`;

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download tripsheet error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate Excel file',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
