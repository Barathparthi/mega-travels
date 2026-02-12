import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import User from '@/backend/models/user.model';

/**
 * GET /api/admin/users/[id]
 * Get a specific user
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

        const user = await User.findById(params.id)
            .select('-password')
            .populate('assignedVehicleId', 'vehicleNumber vehicleTypeId')
            .lean();

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch user',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/users/[id]
 * Update a user
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

        // If phone number is being updated, clean it
        if (body.phone || body.phoneNumber) {
            const phoneValue = body.phoneNumber || body.phone;
            const cleanPhone = phoneValue.replace(/\D/g, '');

            if (cleanPhone.length !== 10) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Phone number must be 10 digits'
                    },
                    { status: 400 }
                );
            }

            body.phone = cleanPhone;
            delete body.phoneNumber;
        }

        // Don't allow password updates through this endpoint
        delete body.password;

        const { assignedVehicleId } = body;

        const user = await User.findByIdAndUpdate(
            params.id,
            body,
            { new: true, runValidators: true }
        )
            .select('-password')
            .populate('assignedVehicleId', 'vehicleNumber vehicleTypeId');

        // If vehicle is assigned, update the vehicle's assigned driver
        if (assignedVehicleId) {
            await import('@/backend/models/vehicle.model'); // Ensure model is loaded
            const Vehicle = (await import('mongoose')).model('Vehicle');
            await Vehicle.findByIdAndUpdate(assignedVehicleId, {
                assignedDriverId: params.id
            });
        }

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            data: user,
        });
    } catch (error: any) {
        console.error('Update user error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return NextResponse.json(
                {
                    success: false,
                    message: messages.join(', '),
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update user',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user
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

        const user = await User.findByIdAndDelete(params.id);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to delete user',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
