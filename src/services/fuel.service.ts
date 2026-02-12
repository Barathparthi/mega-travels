import { IFuelFilters } from '@/backend/types';

const API_BASE = '/api/admin/fuel';

/**
 * Get fuel summary by vehicle for a given month/year
 */
export async function getFuelSummary(filters: IFuelFilters) {
  const params = new URLSearchParams();

  if (filters.month) params.append('month', String(filters.month));
  if (filters.year) params.append('year', String(filters.year));
  if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);

  const response = await fetch(`${API_BASE}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch fuel summary');
  }

  return response.json();
}

/**
 * Get detailed fuel entries for a specific vehicle
 */
export async function getVehicleFuelDetail(
  vehicleId: string,
  startDate?: Date,
  endDate?: Date
) {
  const params = new URLSearchParams();

  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());

  const response = await fetch(`${API_BASE}/${vehicleId}?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch vehicle fuel detail');
  }

  return response.json();
}

/**
 * Export fuel report to Excel
 */
export async function exportFuelReport(filters: IFuelFilters) {
  const params = new URLSearchParams();

  if (filters.month) params.append('month', String(filters.month));
  if (filters.year) params.append('year', String(filters.year));
  if (filters.vehicleId) params.append('vehicleId', filters.vehicleId);

  const response = await fetch(`${API_BASE}/export?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to export fuel report');
  }

  // Download the file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename = filenameMatch ? filenameMatch[1] : 'Fuel_Report.xlsx';

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
