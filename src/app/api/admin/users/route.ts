import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import User from '@/backend/models/user.model';
import Vehicle from '@/backend/models/vehicle.model';

/**
 * GET /api/admin/users
 * Get all users (drivers, attenders, etc.)
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

        // Ensure Vehicle model is registered for populate
        Vehicle.modelName;

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        const query: any = {};
        if (role && role !== 'all') {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password')
            .populate('assignedVehicleId', 'vehicleNumber vehicleTypeId routeName driverPassengers')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        console.error('Get users error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch users',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/users
 * Create a new user (driver, attender, etc.)
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
        const { name, email, password, phoneNumber, phone, role, assignedVehicleId } = body;

        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Name, email, and password are required'
                },
                { status: 400 }
            );
        }

        // Use phoneNumber if provided, otherwise use phone
        const phoneValue = phoneNumber || phone;

        if (!phoneValue) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Phone number is required'
                },
                { status: 400 }
            );
        }

        // Extract only digits from phone number
        const cleanPhone = phoneValue.replace(/\D/g, '');

        // Validate phone number (should be 10 digits)
        if (cleanPhone.length !== 10) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Phone number must be 10 digits'
                },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User with this email already exists'
                },
                { status: 400 }
            );
        }

        // Create the user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            phone: cleanPhone,
            role: role || 'driver',
            assignedVehicleId: assignedVehicleId || undefined,
            isActive: true,
        });

        // If vehicle is assigned, update the vehicle's assigned driver
        if (assignedVehicleId) {
            await Vehicle.findByIdAndUpdate(assignedVehicleId, {
                assignedDriverId: user._id
            });
        }

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            data: userResponse,
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create user error:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User with this email already exists',
                },
                { status: 400 }
            );
        }

        // Handle validation errors
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
                message: error.message || 'Failed to create user',
            },
            { status: 500 }
        );
    }
}
