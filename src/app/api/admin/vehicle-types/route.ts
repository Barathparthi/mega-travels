import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleType from '@/backend/models/vehicle-type.model';


/**
 * GET /api/admin/vehicle-types
 * Get all vehicle types
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

        const vehicleTypes = await VehicleType.find({ isActive: true })
            .sort({ name: 1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: vehicleTypes,
        });
    } catch (error: any) {
        console.error('Get vehicle types error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch vehicle types',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/vehicle-types
 * Create a new vehicle type
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

        const vehicleType = await VehicleType.create(body);

        return NextResponse.json({
            success: true,
            message: 'Vehicle type created successfully',
            data: vehicleType,
        });
    } catch (error: any) {
        console.error('Create vehicle type error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create vehicle type',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
