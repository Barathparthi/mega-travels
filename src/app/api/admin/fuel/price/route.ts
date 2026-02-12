import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFuelPrices } from '@/lib/services/fuel-price.service';

/**
 * GET /api/admin/fuel/price
 * Get current fuel prices (petrol/diesel) for India
 * 
 * Query params:
 * - state: State name (default: Tamil Nadu)
 * - refresh: Force refresh cache (true/false)
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

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'Tamil Nadu';
    const forceRefresh = searchParams.get('refresh') === 'true';

    const response = await getFuelPrices(state, forceRefresh);

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

