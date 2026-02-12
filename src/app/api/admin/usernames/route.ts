
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import UserName from '@/backend/models/user-name.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();
        const userNames = await UserName.find({}).sort({ userName: 1 });

        return NextResponse.json({ data: userNames });
    } catch (error) {
        console.error('Error fetching user names:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user names' },
            { status: 500 }
        );
    }
}
