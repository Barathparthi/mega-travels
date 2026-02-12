import type {
  IMonthlyReport,
  IVehiclePerformance,
  IDriverPerformance,
  IBillingBreakdown,
} from '@/backend/types';

const API_BASE = '/api/admin/reports';

/**
 * Get monthly comprehensive report
 */
export async function getMonthlyReport(
  month: number,
  year: number,
  monthsBack: number = 6
): Promise<IMonthlyReport> {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
    monthsBack: String(monthsBack),
  });

  const response = await fetch(`${API_BASE}/monthly?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch monthly report');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get vehicle performance report
 */
export async function getVehicleReport(
  vehicleId: string,
  monthsBack: number = 12
): Promise<IVehiclePerformance> {
  const params = new URLSearchParams({
    vehicleId,
    monthsBack: String(monthsBack),
  });

  const response = await fetch(`${API_BASE}/vehicles?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch vehicle report');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get driver performance report
 */
export async function getDriverReport(
  driverId: string,
  monthsBack: number = 12
): Promise<IDriverPerformance> {
  const params = new URLSearchParams({
    driverId,
    monthsBack: String(monthsBack),
  });

  const response = await fetch(`${API_BASE}/drivers?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch driver report');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get billing breakdown report
 */
export async function getBillingReport(
  month: number,
  year: number
): Promise<IBillingBreakdown> {
  const params = new URLSearchParams({
    month: String(month),
    year: String(year),
  });

  const response = await fetch(`${API_BASE}/billing?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch billing report');
  }

  const data = await response.json();
  return data.data;
}
