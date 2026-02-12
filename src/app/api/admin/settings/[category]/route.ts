import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Settings from '@/backend/models/settings.model';

/**
 * GET /api/admin/settings/[category]
 * Get settings by category
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { category: string } }
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

        const { category } = params;

        if (!['company', 'billing', 'salary', 'system'].includes(category)) {
            return NextResponse.json(
                { success: false, message: 'Invalid category' },
                { status: 400 }
            );
        }

        const settings = await Settings.getByCategory(category);

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error: any) {
        console.error('Get category settings error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch settings',
                error: error.message,
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/settings/[category]
 * Update settings for a category
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { category: string } }
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

        const { category } = params;
        const body = await request.json();

        if (!['company', 'billing', 'salary', 'system'].includes(category)) {
            return NextResponse.json(
                { success: false, message: 'Invalid category' },
                { status: 400 }
            );
        }

        // Update each setting in the category
        const promises = Object.entries(body).map(([key, value]) =>
            Settings.setSetting(key, value, category, session.user.id)
        );

        await Promise.all(promises);

        return NextResponse.json({
            success: true,
            message: `${category} settings updated successfully`,
        });
    } catch (error: any) {
        console.error('Update category settings error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update settings',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
