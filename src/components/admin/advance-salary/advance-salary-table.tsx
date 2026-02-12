'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, CheckCircle2, XCircle, Wallet, Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApproveAdvanceModal } from './approve-advance-modal';
import { RejectAdvanceModal } from './reject-advance-modal';
import { PayAdvanceModal } from './pay-advance-modal';

interface AdvanceSalary {
  _id: string;
  advanceId: string;
  driverId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  vehicleId: {
    _id: string;
    vehicleNumber: string;
  };
  amount: number;
  requestedDate: string;
  requestedMonth: number;
  requestedYear: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'deducted';
  approvedBy?: { name: string };
  approvedAt?: string;
  paidAt?: string;
  paidBy?: { name: string };
  rejectedBy?: { name: string };
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export function AdvanceSalaryTable() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<AdvanceSalary | null>(null);
  const queryClient = useQueryClient();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  // Fetch advances
  const { data, isLoading, error } = useQuery({
    queryKey: ['advance-salary', selectedMonth, selectedYear, selectedStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth.toString());
      if (selectedYear) params.append('year', selectedYear.toString());
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);
      
      const res = await fetch(`/api/admin/advance-salary?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch advance salary');
      return res.json();
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/advance-salary/${id}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to approve advance');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advance-salary'] });
      toast.success('Advance approved successfully');
      setApproveModalOpen(false);
      setSelectedAdvance(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason?: string }) => {
      const res = await fetch(`/api/admin/advance-salary/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject advance');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advance-salary'] });
      toast.success('Advance rejected successfully');
      setRejectModalOpen(false);
      setSelectedAdvance(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await fetch(`/api/admin/advance-salary/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to mark advance as paid');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advance-salary'] });
      toast.success('Advance marked as paid successfully');
      setPayModalOpen(false);
      setSelectedAdvance(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const advances: AdvanceSalary[] = data?.data || [];
  const stats = data?.stats || {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    deducted: 0,
    rejected: 0,
    totalAmount: 0,
    pendingAmount: 0,
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { className: 'bg-blue-100 text-blue-800', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
      paid: { className: 'bg-green-100 text-green-800', label: 'Paid' },
      deducted: { className: 'bg-purple-100 text-purple-800', label: 'Deducted' },
    };
    const statusConfig = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant="outline" className={`${statusConfig.className} border font-medium`}>
        {statusConfig.label}
      </Badge>
    );
  };

  const handleApprove = (advance: AdvanceSalary) => {
    setSelectedAdvance(advance);
    setApproveModalOpen(true);
  };

  const handleReject = (advance: AdvanceSalary) => {
    setSelectedAdvance(advance);
    setRejectModalOpen(true);
  };

  const handlePay = (advance: AdvanceSalary) => {
    setSelectedAdvance(advance);
    setPayModalOpen(true);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          <p>Error: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Deducted</p>
            <p className="text-2xl font-bold text-purple-600">{stats.deducted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-2xl font-bold">{formatIndianCurrency(stats.totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Advance Salary Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="w-[180px]">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[120px]">
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
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
            <div className="w-[150px]">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="deducted">Deducted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by driver, vehicle, or advance ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : advances.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No advance salary records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Advance ID</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Requested For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advances.map((advance) => (
                    <TableRow key={advance._id}>
                      <TableCell className="font-medium">{advance.advanceId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{advance.driverId.name}</p>
                          <p className="text-sm text-gray-500">{advance.driverId.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{advance.vehicleId.vehicleNumber}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatIndianCurrency(advance.amount)}
                      </TableCell>
                      <TableCell>
                        {months[advance.requestedMonth - 1]} {advance.requestedYear}
                      </TableCell>
                      <TableCell>{getStatusBadge(advance.status)}</TableCell>
                      <TableCell>{format(new Date(advance.requestedDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {advance.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(advance)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(advance)}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {advance.status === 'approved' && (
                              <DropdownMenuItem onClick={() => handlePay(advance)}>
                                <Wallet className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {advance.reason && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Reason: {advance.reason}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ApproveAdvanceModal
        open={approveModalOpen}
        onOpenChange={setApproveModalOpen}
        advance={selectedAdvance}
        onApprove={(id) => approveMutation.mutate(id)}
        isLoading={approveMutation.isPending}
      />
      <RejectAdvanceModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        advance={selectedAdvance}
        onReject={(id, reason) => rejectMutation.mutate({ id, rejectionReason: reason })}
        isLoading={rejectMutation.isPending}
      />
      <PayAdvanceModal
        open={payModalOpen}
        onOpenChange={setPayModalOpen}
        advance={selectedAdvance}
        onPay={(id, notes) => payMutation.mutate({ id, notes })}
        isLoading={payMutation.isPending}
      />
    </>
  );
}

