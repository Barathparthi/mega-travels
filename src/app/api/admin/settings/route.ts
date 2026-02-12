import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import Settings from '@/backend/models/settings.model';

/**
 * GET /api/admin/settings
 * Get all settings grouped by category
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

        const allSettings = await Settings.getAll();

        // Group by category
        const grouped: Record<string, Record<string, any>> = {
            company: {},
            billing: {},
            salary: {},
            system: {},
        };

        Object.entries(allSettings).forEach(([key, value]) => {
            const [category, ...rest] = key.split('.');
            if (grouped[category]) {
                grouped[category][key] = value;
            }
        });

        return NextResponse.json({
            success: true,
            data: grouped,
        });
    } catch (error: any) {
        console.error('Get settings error:', error);
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
 * POST /api/admin/settings
 * Update multiple settings at once
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
        const { settings } = body;

        if (!settings || !Array.isArray(settings)) {
            return NextResponse.json(
                { success: false, message: 'Invalid settings format' },
                { status: 400 }
            );
        }

        // Update each setting
        const promises = settings.map(({ key, value, category }: any) =>
            Settings.setSetting(key, value, category, session.user.id)
        );

        await Promise.all(promises);

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully',
        });
    } catch (error: any) {
        console.error('Update settings error:', error);
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
