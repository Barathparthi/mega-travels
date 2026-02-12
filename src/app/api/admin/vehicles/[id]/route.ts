import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Vehicle from '@/backend/models/vehicle.model';

/**
 * GET /api/admin/vehicles/[id]
 * Get a specific vehicle
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

        const vehicle = await Vehicle.findById(params.id)
            .populate('vehicleType', 'name code')
            .populate('assignedDriverId', 'name email')
            .lean();

        if (!vehicle) {
            return NextResponse.json(
                { success: false, message: 'Vehicle not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: vehicle,
        });
    } catch (error: any) {
        console.error('Get vehicle error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch vehicle',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/vehicles/[id]
 * Update a vehicle
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
        console.log('Update Vehicle Body:', body);
        const { vehicleNumber, vehicleTypeId, status, routeName, driverPassengers } = body;

        const updateData: any = {
            vehicleNumber,
            vehicleTypeId,
            status,
            routeName,
            driverPassengers
        };

        console.log('Update Data:', updateData);

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);


        const vehicle = await Vehicle.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('vehicleType', 'name code')
            .populate('assignedDriverId', 'name email');

        if (!vehicle) {
            return NextResponse.json(
                { success: false, message: 'Vehicle not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Vehicle updated successfully',
            data: vehicle,
        });
    } catch (error: any) {
        console.error('Update vehicle error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update vehicle',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/vehicles/[id]
 * Delete a vehicle
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

        const vehicle = await Vehicle.findByIdAndDelete(params.id);

        if (!vehicle) {
            return NextResponse.json(
                { success: false, message: 'Vehicle not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Vehicle deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete vehicle error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to delete vehicle',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
