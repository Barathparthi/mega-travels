import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/admin/settings/logo
 * Upload company logo
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

        const formData = await request.formData();
        const file = formData.get('logo') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: 'Invalid file type. Only PNG and JPG allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { success: false, message: 'File too large. Maximum size is 2MB.' },
                { status: 400 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = file.name.split('.').pop();
        const filename = `logo.${ext}`;
        const filepath = join(uploadsDir, filename);

        await writeFile(filepath, buffer);

        const logoUrl = `/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            data: { logoUrl },
            message: 'Logo uploaded successfully',
        });
    } catch (error: any) {
        console.error('Logo upload error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to upload logo',
                error: error.message,
            },
            { status: 500 }
        );
    }
}
