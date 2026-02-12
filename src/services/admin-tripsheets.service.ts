import type { ITripsheetFilters } from '@/backend/types';

export async function fetchTripsheets(filters: ITripsheetFilters) {
  const params = new URLSearchParams();

  if (filters.month) params.append('month', filters.month.toString());
  if (filters.year) params.append('year', filters.year.toString());
  if (filters.status) params.append('status', filters.status);
  // Only send vehicleId when a real vehicle is selected
  if (filters.vehicleId && filters.vehicleId !== 'all' && filters.vehicleId !== 'skip') {
    params.append('vehicleId', filters.vehicleId);
  }
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const res = await fetch(`/api/admin/tripsheets?${params.toString()}`);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch tripsheets');
  }

  return res.json();
}

export async function fetchTripsheet(id: string) {
  const res = await fetch(`/api/admin/tripsheets/${id}`);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch tripsheet');
  }

  return res.json();
}

export async function approveTripsheet(id: string) {
  const res = await fetch(`/api/admin/tripsheets/${id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to approve tripsheet');
  }

  return res.json();
}

export async function rejectTripsheet(id: string, reason: string) {
  const res = await fetch(`/api/admin/tripsheets/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to reject tripsheet');
  }

  return res.json();
}

export function getDownloadUrl(id: string): string {
  return `/api/admin/tripsheets/${id}/download`;
}
