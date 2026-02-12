import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleType from '@/backend/models/vehicle-type.model';


/**
 * GET /api/admin/vehicle-types/[id]
 * Get a specific vehicle type
 */
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

        const vehicleType = await VehicleType.findById(params.id).lean();

        if (!vehicleType) {
            return NextResponse.json(
                { success: false, message: 'Vehicle type not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: vehicleType,
        });
    } catch (error: any) {
        console.error('Get vehicle type error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch vehicle type',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/vehicle-types/[id]
 * Update a vehicle type
 */
export async function PUT(
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

        const body = await request.json();

        const vehicleType = await VehicleType.findByIdAndUpdate(
            params.id,
            body,
            { new: true, runValidators: true }
        );

        if (!vehicleType) {
            return NextResponse.json(
                { success: false, message: 'Vehicle type not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Vehicle type updated successfully',
            data: vehicleType,
        });
    } catch (error: any) {
        console.error('Update vehicle type error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update vehicle type',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/vehicle-types/[id]
 * Delete a vehicle type (soft delete by setting isActive to false)
 */
export async function DELETE(
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

        const vehicleType = await VehicleType.findByIdAndUpdate(
            params.id,
            { isActive: false },
            { new: true }
        );

        if (!vehicleType) {
            return NextResponse.json(
                { success: false, message: 'Vehicle type not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Vehicle type deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete vehicle type error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to delete vehicle type',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
