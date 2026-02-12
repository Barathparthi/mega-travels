import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import DriverData from '@/backend/models/driver-data.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/drivers-data
 * Fetch all drivers from DriverData collection
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        const drivers = await DriverData.find({}).sort({ driverName: 1 }).lean();

        console.log(`Fetched ${drivers.length} drivers from DriverData collection`);

        return NextResponse.json({
            success: true,
            data: drivers,
            count: drivers.length,
        });
    } catch (error) {
        console.error('Error fetching driver data:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch driver data',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
