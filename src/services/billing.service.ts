const API_URL = '/api/admin/billing';

export interface Bill {
  _id: string;
  tripSheetId: {
    _id: string;
    tripSheetNumber: string;
    vehicleId: {
      registrationNumber: string;
      vehicleModel: string;
    };
    driverId: {
      name: string;
      employeeId: string;
    };
  };
  month: number;
  year: number;
  billing: {
    totalKm: number;
    perKmRate: number;
    subtotal: number;
    adjustments: Array<{
      type: 'add' | 'deduct';
      amount: number;
      reason: string;
    }>;
    finalAmount: number;
  };
  status: 'generated' | 'sent' | 'paid';
  generatedBy: {
    name: string;
    email: string;
  };
  generatedAt: string;
  sentAt?: string;
  paidAt?: string;
  notes?: string;
}

export interface PendingTripSheet {
  _id: string;
  tripSheetNumber: string;
  vehicleId: {
    _id: string;
    registrationNumber: string;
    vehicleModel: string;
  };
  driverId: {
    _id: string;
    name: string;
    employeeId: string;
  };
  month: number;
  year: number;
  totalDistance: number;
  status: string;
}

export interface GenerateBillData {
  tripSheetId: string;
  // Note: perKmRate and adjustments are no longer used - billing is calculated automatically
  // Keeping for backward compatibility but API will ignore these fields
  perKmRate?: number;
  adjustments?: Array<{
    type: 'add' | 'deduct';
    amount: number;
    reason: string;
  }>;
  notes?: string;
}

export interface UpdateBillData {
  perKmRate?: number;
  adjustments?: Array<{
    type: 'add' | 'deduct';
    amount: number;
    reason: string;
  }>;
  notes?: string;
}

export interface BillingFilters {
  month?: number;
  year?: number;
  status?: 'generated' | 'sent' | 'paid';
  vehicleId?: string;
}

export interface VehicleBreakdown {
  vehicleNumber: string;
  amount: number;
}

export interface BillingStats {
  total: number;
  generated: number;
  sent: number;
  paid: number;
  totalAmount: number; // Total from generated bills
  totalTripsheetRevenue?: number; // Total revenue from all approved tripsheets
  totalTripsheets?: number; // Total number of approved tripsheets
  vehicleBreakdown?: VehicleBreakdown[]; // Vehicle-wise breakdown
}

export interface BillingResponse {
  bills: Bill[];
  stats: BillingStats;
}

class BillingService {
  async getPendingBilling(): Promise<PendingTripSheet[]> {
    const response = await fetch(`${API_URL}/pending`);
    const data = await response.json();
    if (!data.success || !data.data || !Array.isArray(data.data)) {
      return [];
    }
    // Transform tripsheets to match PendingTripSheet interface
    return data.data.map((ts: any) => ({
      _id: ts._id,
      tripSheetNumber: ts.tripsheetNumber || ts.tripSheetNumber || '',
      vehicleId: {
        _id: ts.vehicleId?._id || ts.vehicleId || '',
        registrationNumber: ts.vehicleId?.vehicleNumber || ts.vehicleId?.registrationNumber || '',
        vehicleModel: ts.vehicleId?.description || ts.vehicleId?.vehicleModel || 'N/A',
      },
      driverId: {
        _id: ts.driverId?._id || ts.driverId || '',
        name: ts.driverId?.name || 'Unknown',
        employeeId: ts.driverId?.employeeId || 'N/A',
      },
      month: ts.month || new Date().getMonth() + 1,
      year: ts.year || new Date().getFullYear(),
      totalDistance: Number(ts.summary?.totalKms ?? ts.totalKms ?? ts.totalDistance ?? 0),
      status: ts.status || 'pending',
    }));
  }

  async getAllBills(filters?: BillingFilters): Promise<BillingResponse> {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);

    const response = await fetch(`${API_URL}?${params}`);
    const data = await response.json();
    return {
      bills: data.data || [],
      stats: data.stats || { total: 0, generated: 0, sent: 0, paid: 0, totalAmount: 0 },
    };
  }

  async getBillById(id: string): Promise<Bill> {
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();
    return data.data;
  }

  async generateBill(data: GenerateBillData): Promise<Bill> {
    // API expects 'tripsheetId' (lowercase 's'), but interface uses 'tripSheetId'
    // Only send tripsheetId - API calculates billing automatically
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripsheetId: data.tripSheetId,
        // Note: perKmRate and adjustments are calculated by API, not sent from client
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate bill');
    }
    const result = await response.json();
    return result.data;
  }

  async updateBill(id: string, data: UpdateBillData): Promise<Bill> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return result.data;
  }

  async updateBillStatus(
    id: string,
    status: 'sent' | 'paid'
  ): Promise<Bill> {
    const response = await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    return result.data;
  }

  async deleteBill(id: string): Promise<void> {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  }

  // Utility function to format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Utility function to get month name
  static getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1] || '';
  }

  // Utility function to format month-year
  static formatMonthYear(month: number, year: number): string {
    return `${this.getMonthName(month)} ${year}`;
  }
}

export { BillingService };
export default new BillingService();
