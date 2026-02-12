const API_URL = '/api/admin/salary';

export interface DriverSalary {
  _id: string;
  salaryId: string;
  driverId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    licenseNumber?: string;
  };
  vehicleId: {
    _id: string;
    vehicleNumber: string;
    description?: string;
    routeName?: string;
  };
  tripsheetId: {
    _id: string;
    tripsheetNumber: string;
    status: string;
    entries?: any[];
    summary?: any;
  };
  month: number;
  year: number;
  calculation: {
    totalWorkingDays: number;
    baseDays: number;
    extraDays: number;
    baseSalary: number;
    extraDayRate: number;
    extraDaysAmount: number;
    totalHours: number;
    totalDriverExtraHours: number;
    extraHourRate: number;
    extraHoursAmount: number;
    totalSalary: number;
    advanceDeduction?: number;
    amountInWords: string;
  };
  status: 'pending' | 'generated' | 'paid';
  paidAt?: string;
  paidBy?: {
    _id: string;
    name: string;
    email: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryFilters {
  month?: number;
  year?: number;
  status?: 'all' | 'pending' | 'generated' | 'paid';
  driverId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GenerateSalaryData {
  tripsheetId: string;
  notes?: string;
}

export interface GenerateAllSalariesData {
  month: number;
  year: number;
}

export interface MarkPaidData {
  notes?: string;
}

export interface UpdateSalaryData {
  notes?: string;
}

export interface SalaryStats {
  total: number;
  pending: number;
  generated: number;
  paid: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

export interface SalaryResponse {
  success: boolean;
  data: DriverSalary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: SalaryStats;
}

class DriverSalaryService {
  async getAllSalaries(filters?: SalaryFilters): Promise<SalaryResponse> {
    const params = new URLSearchParams();

    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_URL}?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch salaries');
    }

    return data;
  }

  async getSalaryById(id: string): Promise<DriverSalary> {
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch salary');
    }

    return data.data;
  }

  async generateSalary(data: GenerateSalaryData): Promise<DriverSalary> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to generate salary');
    }

    return result.data;
  }

  async generateAllSalaries(
    data: GenerateAllSalariesData
  ): Promise<{
    data: DriverSalary[];
    stats: {
      totalApprovedTripsheets: number;
      alreadyGenerated: number;
      newlyGenerated: number;
      errors: number;
    };
    errors?: any[];
  }> {
    const response = await fetch(`${API_URL}/generate-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to generate salaries');
    }

    return result;
  }

  async updateSalary(
    id: string,
    data: UpdateSalaryData
  ): Promise<DriverSalary> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update salary');
    }

    return result.data;
  }

  async markAsPaid(id: string, data: MarkPaidData): Promise<DriverSalary> {
    const response = await fetch(`${API_URL}/${id}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to mark salary as paid');
    }

    return result.data;
  }

  async deleteSalary(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete salary');
    }
  }

  async exportToExcel(filters?: {
    month?: number;
    year?: number;
    status?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.status && filters.status !== 'all')
      params.append('status', filters.status);

    const response = await fetch(`${API_URL}/export?${params}`);

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to export salaries');
    }

    return response.blob();
  }

  // Utility function to download Excel file
  downloadExcel(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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

  // Utility function to get status badge color
  static getStatusColor(status: string): {
    bg: string;
    text: string;
    border: string;
  } {
    switch (status) {
      case 'paid':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
        };
      case 'generated':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
        };
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
        };
    }
  }
}

export { DriverSalaryService };
export default new DriverSalaryService();
