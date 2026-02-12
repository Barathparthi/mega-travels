import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import User from '@/backend/models/user.model';

/**
 * PUT /api/admin/users/[id]/password
 * Update user password (admin only)
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
        const { password } = body;

        if (!password || password.length < 6) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Password must be at least 6 characters long',
                },
                { status: 400 }
            );
        }

        // Find user and update password
        // Using findById + save to trigger the pre-save hook for password hashing
        const user = await User.findById(params.id);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Set password directly - the pre-save hook will hash it
        user.password = password;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error: any) {
        console.error('Update password error:', error);

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
                message: 'Failed to update password',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

