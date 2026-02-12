'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface VehicleLoan {
  _id: string;
  vehicleNumber: string;
  financeName: string;
  accountName: string;
  loanStartDate: string;
  emiAmount: number;
  totalEmis?: number;
  emiDate: number;
  isActive: boolean;
}

interface EditLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: VehicleLoan;
}

export function EditLoanModal({ open, onOpenChange, loan }: EditLoanModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vehicleNumber: loan.vehicleNumber,
    financeName: loan.financeName,
    accountName: loan.accountName,
    loanStartDate: format(new Date(loan.loanStartDate), 'yyyy-MM-dd'),
    loanAmount: '',
    emiAmount: loan.emiAmount.toString(),
    totalEmis: loan.totalEmis?.toString() || '',
    emiDate: loan.emiDate.toString(),
    isActive: loan.isActive,
  });

  useEffect(() => {
    if (loan) {
      setFormData({
        vehicleNumber: loan.vehicleNumber,
        financeName: loan.financeName,
        accountName: loan.accountName,
        loanStartDate: format(new Date(loan.loanStartDate), 'yyyy-MM-dd'),
        loanAmount: '',
        emiAmount: loan.emiAmount.toString(),
        totalEmis: loan.totalEmis?.toString() || '',
        emiDate: loan.emiDate.toString(),
        isActive: loan.isActive,
      });
    }
  }, [loan]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/loans/${loan._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update loan');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-reminders'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      vehicleNumber: formData.vehicleNumber,
      financeName: formData.financeName,
      accountName: formData.accountName,
      loanStartDate: formData.loanStartDate,
      loanAmount: formData.loanAmount ? parseFloat(formData.loanAmount) : undefined,
      emiAmount: parseFloat(formData.emiAmount),
      totalEmis: formData.totalEmis ? parseInt(formData.totalEmis) : undefined,
      emiDate: parseInt(formData.emiDate),
      isActive: formData.isActive,
    });
  };

  const emiDates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Loan Record</DialogTitle>
          <DialogDescription>
            Update loan details for {loan.vehicleNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="financeName">Finance Name *</Label>
                <Input
                  id="financeName"
                  value={formData.financeName}
                  onChange={(e) => setFormData({ ...formData, financeName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanStartDate">Loan Start Date *</Label>
                <Input
                  id="loanStartDate"
                  type="date"
                  value={formData.loanStartDate}
                  onChange={(e) => setFormData({ ...formData, loanStartDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emiAmount">EMI Amount *</Label>
                <Input
                  id="emiAmount"
                  type="number"
                  value={formData.emiAmount}
                  onChange={(e) => setFormData({ ...formData, emiAmount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emiDate">EMI Date (Day) *</Label>
                <Select
                  value={formData.emiDate}
                  onValueChange={(value) => setFormData({ ...formData, emiDate: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emiDates.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={formData.isActive.toString()}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Loan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

