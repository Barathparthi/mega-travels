import { VehicleTypeCode } from '@/backend/types';

/**
 * Expected mileage thresholds by vehicle type
 * Used for health indicators and performance tracking
 */
export const EXPECTED_MILEAGE = {
  [VehicleTypeCode.DZIRE]: {
    good: 14,
    average: 12,
    poor: 10,
  },
  [VehicleTypeCode.BOLERO]: {
    good: 11,
    average: 9,
    poor: 7,
  },
  [VehicleTypeCode.CRYSTA]: {
    good: 9,
    average: 7,
    poor: 5,
  },
};

/**
 * Get mileage health status based on vehicle type and actual mileage
 */
export function getMileageHealth(
  vehicleType: VehicleTypeCode,
  mileage: number
): 'good' | 'average' | 'poor' {
  const thresholds = EXPECTED_MILEAGE[vehicleType];

  if (!thresholds) {
    return 'average';
  }

  if (mileage >= thresholds.good) {
    return 'good';
  } else if (mileage >= thresholds.average) {
    return 'average';
  } else {
    return 'poor';
  }
}

/**
 * Get trend indicator based on current vs previous mileage
 */
export function getMileageTrend(
  currentMileage: number,
  previousMileage: number
): 'up' | 'down' | 'stable' {
  if (!previousMileage || previousMileage === 0) {
    return 'stable';
  }

  const changePercent = ((currentMileage - previousMileage) / previousMileage) * 100;

  if (changePercent > 5) {
    return 'up';
  } else if (changePercent < -5) {
    return 'down';
  } else {
    return 'stable';
  }
}

/**
 * Format mileage value with unit
 */
export function formatMileage(mileage: number): string {
  return `${mileage.toFixed(2)} km/L`;
}

/**
 * Format litres value with unit
 */
export function formatLitres(litres: number): string {
  return `${litres.toFixed(1)} L`;
}
