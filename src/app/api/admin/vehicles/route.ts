import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import User from '@/backend/models/user.model';

/**
 * GET /api/admin/vehicles
 * Get all vehicles
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

        // Ensure models are registered
        VehicleType.modelName;
        User.modelName;

        const vehicles = await Vehicle.find()
            .populate('vehicleType', 'name code') // Populate the virtual
            .populate('assignedDriverId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: vehicles,
        });
    } catch (error: any) {
        console.error('Error fetching vehicles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vehicles', details: (error as Error).message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/vehicles
 * Create a new vehicle
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
        const { vehicleNumber, vehicleTypeId, routeName, driverPassengers } = body;

        // Validate required fields
        if (!vehicleNumber || !vehicleTypeId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Vehicle number and vehicle type are required'
                },
                { status: 400 }
            );
        }

        // Check if vehicle number already exists
        const existingVehicle = await Vehicle.findOne({
            vehicleNumber: vehicleNumber.toUpperCase().replace(/\s+/g, ' ')
        });

        if (existingVehicle) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Vehicle with this number already exists'
                },
                { status: 400 }
            );
        }

        // Create the vehicle
        const vehicle = await Vehicle.create({
            vehicleNumber,
            vehicleTypeId,
            routeName,
            driverPassengers,
            status: 'active',
        });

        // Manually fetch vehicle type since vehicleTypeId is a string (name), not ObjectId
        const vehicleType = await VehicleType.findOne({ name: vehicle.vehicleTypeId })
            .select('name code')
            .lean();
        vehicle.vehicleTypeId = vehicleType as any;

        return NextResponse.json({
            success: true,
            message: 'Vehicle created successfully',
            data: vehicle,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create vehicle error:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Vehicle with this number already exists',
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create vehicle',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
