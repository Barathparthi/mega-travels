import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import User from '@/backend/models/user.model';

/**
 * PUT /api/admin/password
 * Update admin's own password (requires current password verification)
 */
export async function PUT(request: NextRequest) {
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is required',
        },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be at least 6 characters long',
        },
        { status: 400 }
      );
    }

    // Find user with password field selected
    const user = await User.findById(session.user.id).select('+password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect',
        },
        { status: 400 }
      );
    }

    // Set new password - the pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    console.error('Change password error:', error);

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
