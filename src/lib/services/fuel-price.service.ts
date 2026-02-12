/**
 * Fuel Price Service
 * Fetches India petrol/diesel prices from external APIs
 */

export interface FuelPriceData {
  petrol: number;
  diesel: number;
  state?: string;
  city?: string;
  lastUpdated: Date;
}

export interface FuelPriceResponse {
  success: boolean;
  data?: FuelPriceData;
  error?: string;
  cached?: boolean;
}

// Cache fuel prices for 24 hours (to reduce API calls)
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
let priceCache: { data: FuelPriceData; timestamp: number } | null = null;

/**
 * Default fuel prices (fallback if API is unavailable)
 * These are approximate average prices for Tamil Nadu as of late 2024
 */
const DEFAULT_PRICES: FuelPriceData = {
  petrol: 102.50,
  diesel: 93.50,
  state: 'Tamil Nadu',
  lastUpdated: new Date(),
};

/**
 * Fetch fuel prices from APIMall (Fuel Price by State API)
 * Free tier available with API key
 * 
 * API Documentation: https://apimall.in/products/fuel-price/fuel-price-by-state-api
 */
async function fetchFromAPIMall(state: string = 'Tamil Nadu'): Promise<FuelPriceData | null> {
  const apiKey = process.env.FUEL_PRICE_API_KEY;
  
  if (!apiKey) {
    console.warn('FUEL_PRICE_API_KEY not set. Using default prices.');
    return null;
  }

  try {
    // Note: Replace with actual APIMall endpoint when you get API key
    const response = await fetch(
      `https://api.apimall.in/v1/fuel-price/state?state=${encodeURIComponent(state)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Adapt response structure based on actual API response format
    // This is a placeholder - adjust based on actual API response
    return {
      petrol: data.petrol || data.petrol_price || DEFAULT_PRICES.petrol,
      diesel: data.diesel || data.diesel_price || DEFAULT_PRICES.diesel,
      state: data.state || state,
      city: data.city,
      lastUpdated: new Date(data.lastUpdated || Date.now()),
    };
  } catch (error) {
    console.error('Error fetching fuel prices from APIMall:', error);
    return null;
  }
}

/**
 * Alternative: Fetch from PurePriceIO API
 * Free tier: 200 credits to start
 */
async function fetchFromPurePriceIO(city: string = 'Chennai'): Promise<FuelPriceData | null> {
  const apiKey = process.env.FUEL_PRICE_API_KEY;
  
  if (!apiKey) {
    return null;
  }

  try {
    // Note: Replace with actual PurePriceIO endpoint when you get API key
    const response = await fetch(
      `https://api.purepriceio.com/v1/prices?city=${encodeURIComponent(city)}&fuel=petrol`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    
    return {
      petrol: data.petrol || data.petrol_price || DEFAULT_PRICES.petrol,
      diesel: data.diesel || data.diesel_price || DEFAULT_PRICES.diesel,
      city: data.city || city,
      lastUpdated: new Date(data.updated_at || Date.now()),
    };
  } catch (error) {
    console.error('Error fetching fuel prices from PurePriceIO:', error);
    return null;
  }
}

/**
 * Get fuel prices with caching
 * Tries multiple sources and falls back to defaults
 */
export async function getFuelPrices(
  state: string = 'Tamil Nadu',
  forceRefresh: boolean = false
): Promise<FuelPriceResponse> {
  // Check cache first
  if (!forceRefresh && priceCache) {
    const cacheAge = Date.now() - priceCache.timestamp;
    if (cacheAge < CACHE_DURATION) {
      return {
        success: true,
        data: priceCache.data,
        cached: true,
      };
    }
  }

  // Try to fetch from APIs
  let priceData: FuelPriceData | null = null;

  // Try APIMall first
  priceData = await fetchFromAPIMall(state);
  
  // If APIMall fails, try PurePriceIO
  if (!priceData) {
    const city = state === 'Tamil Nadu' ? 'Chennai' : undefined;
    priceData = await fetchFromPurePriceIO(city);
  }

  // If all APIs fail, use default prices
  if (!priceData) {
    priceData = {
      ...DEFAULT_PRICES,
      state,
      lastUpdated: new Date(),
    };
  }

  // Update cache
  priceCache = {
    data: priceData,
    timestamp: Date.now(),
  };

  return {
    success: true,
    data: priceData,
    cached: false,
  };
}

/**
 * Get petrol price only
 */
export async function getPetrolPrice(state?: string): Promise<number> {
  const response = await getFuelPrices(state);
  return response.data?.petrol || DEFAULT_PRICES.petrol;
}

/**
 * Get diesel price only
 */
export async function getDieselPrice(state?: string): Promise<number> {
  const response = await getFuelPrices(state);
  return response.data?.diesel || DEFAULT_PRICES.diesel;
}

/**
 * Clear price cache (useful for testing or forced refresh)
 */
export function clearPriceCache(): void {
  priceCache = null;
}

