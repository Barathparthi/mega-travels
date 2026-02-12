import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import User from '@/backend/models/user.model';
import Vehicle from '@/backend/models/vehicle.model';
import VehicleType from '@/backend/models/vehicle-type.model';
import Tripsheet from '@/backend/models/tripsheet.model';
import Billing from '@/backend/models/billing.model';
import DriverSalary from '@/backend/models/driver-salary.model';
import Settings from '@/backend/models/settings.model';

/**
 * GET /api/admin/settings/export
 * Export all data as JSON
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

        // Fetch all data
        const [users, vehicles, vehicleTypes, tripsheets, billings, salaries, settings] =
            await Promise.all([
                User.find().select('-password').lean(),
                Vehicle.find().lean(),
                VehicleType.find().lean(),
                Tripsheet.find().lean(),
                Billing.find().lean(),
                DriverSalary.find().lean(),
                Settings.find().lean(),
            ]);

        const exportData = {
            exportDate: new Date().toISOString(),
            exportedBy: session.user.email,
            data: {
                users,
                vehicles,
                vehicleTypes,
                tripsheets,
                billings,
                salaries,
                settings,
            },
            counts: {
                users: users.length,
                vehicles: vehicles.length,
                vehicleTypes: vehicleTypes.length,
                tripsheets: tripsheets.length,
                billings: billings.length,
                salaries: salaries.length,
                settings: settings.length,
            },
        };

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="fleet-management-export-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });
    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to export data',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
