'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDriverSalaries, useMarkSalaryPaid, useDeleteSalary, useGenerateAllSalaries, useExportSalaries } from '@/hooks/useDriverSalary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import SalaryTable from '@/components/admin/salary/salary-table';
import MarkPaidModal from '@/components/admin/salary/mark-paid-modal';
import { DriverSalary, SalaryFilters } from '@/services/driver-salary.service';
import {
  DollarSign,
  Search,
  Download,
  RefreshCw,
  Plus,
  Wallet,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';

export default function SalaryListingPage() {
  const currentDate = new Date();
  const [filters, setFilters] = useState<SalaryFilters>({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    status: 'all',
    search: '',
  });

  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<DriverSalary | null>(null);

  const { data, isLoading, refetch } = useDriverSalaries(filters);
  const markPaidMutation = useMarkSalaryPaid();
  const deleteSalaryMutation = useDeleteSalary();
  const generateAllMutation = useGenerateAllSalaries();
  const exportMutation = useExportSalaries();

  const salaries = data?.data || [];
  const stats = data?.stats;

  // Check for pending tripsheets
  const { data: pendingData } = useQuery({
    queryKey: ['pending-salaries', filters.month, filters.year],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month.toString());
      if (filters.year) params.append('year', filters.year.toString());
      const res = await fetch(`/api/admin/salary/pending?${params}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: salaries.length === 0 && !isLoading,
  });

  const handleFilterChange = (key: keyof SalaryFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleMarkPaid = (salary: DriverSalary) => {
    setSelectedSalary(salary);
    setMarkPaidModalOpen(true);
  };

  const handleConfirmMarkPaid = async (notes?: string) => {
    if (!selectedSalary) return;

    await markPaidMutation.mutateAsync({
      id: selectedSalary._id,
      data: { notes },
    });

    setMarkPaidModalOpen(false);
    setSelectedSalary(null);
  };

  const handleDelete = async (salaryId: string) => {
    await deleteSalaryMutation.mutateAsync(salaryId);
  };

  const handleGenerateAll = async () => {
    if (
      window.confirm(
        `Generate salaries for all approved tripsheets in ${getMonthName(filters.month || currentDate.getMonth() + 1)} ${filters.year || currentDate.getFullYear()}?`
      )
    ) {
      try {
        const result = await generateAllMutation.mutateAsync({
          month: filters.month || currentDate.getMonth() + 1,
          year: filters.year || currentDate.getFullYear(),
        });
        if (result?.message) {
          alert(result.message);
        }
        refetch();
      } catch (error: any) {
        alert(error.message || 'Failed to generate salaries. Make sure you have approved tripsheets for this month.');
      }
    }
  };

  const handleExport = async () => {
    await exportMutation.mutateAsync({
      month: filters.month,
      year: filters.year,
      status: filters.status === 'all' ? undefined : filters.status,
    });
  };

  const getMonthName = (month: number) => {
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
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: getMonthName(i + 1),
  }));

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Driver Salary Management
        </h1>
        <p className="text-gray-600">
          Manage and track driver monthly salaries based on working days and hours
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-[#6B4C9A]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Salaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatIndianCurrency(stats.totalAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.paid}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatIndianCurrency(stats.paidAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Unpaid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.generated + stats.pending}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatIndianCurrency(stats.unpaidAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.generated}
              </div>
              <p className="text-xs text-gray-500 mt-1">Ready for payment</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="w-full sm:w-48">
                <Select
                  value={filters.month?.toString()}
                  onValueChange={(value) =>
                    handleFilterChange('month', parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-32">
                <Select
                  value={filters.year?.toString()}
                  onValueChange={(value) =>
                    handleFilterChange('year', parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-40">
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search driver, vehicle, or salary ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exportMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={handleGenerateAll}
                disabled={generateAllMutation.isPending}
                className="bg-[#6B4C9A] hover:bg-[#5a3d82]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Table */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {salaries.length === 0 && pendingData?.data?.pendingCount > 0 && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">
                      {pendingData.data.pendingCount} approved tripsheet{pendingData.data.pendingCount !== 1 ? 's' : ''} ready for salary generation
                    </p>
                    <p className="text-sm text-blue-700">
                      Click "Generate All" button above to create salaries automatically
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <SalaryTable
            salaries={salaries}
            isLoading={isLoading}
            onMarkPaid={handleMarkPaid}
            onDelete={handleDelete}
          />
        </>
      )}

      {/* Mark Paid Modal */}
      <MarkPaidModal
        open={markPaidModalOpen}
        onOpenChange={setMarkPaidModalOpen}
        onConfirm={handleConfirmMarkPaid}
        isLoading={markPaidMutation.isPending}
        salary={selectedSalary || undefined}
      />
    </div>
  );
}
