import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFuelPrices } from '@/lib/services/fuel-price.service';

/**
 * GET /api/driver/fuel-price
 * Get current fuel prices for drivers (public endpoint)
 * Drivers can see current market prices when entering fuel data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow both drivers and admins
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'Tamil Nadu';

    const response = await getFuelPrices(state, false);

    if (!response.success) {
      return NextResponse.json(
        {
          success: false,
          message: response.error || 'Failed to fetch fuel prices',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response.data,
      cached: response.cached || false,
    });
  } catch (error: any) {
    console.error('Fuel price API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch fuel prices',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

