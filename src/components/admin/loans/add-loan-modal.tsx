'use client';

import { useState } from 'react';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AddLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLoanModal({ open, onOpenChange }: AddLoanModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleNumber: '',
    financeName: '',
    accountName: '',
    loanStartDate: format(new Date(), 'yyyy-MM-dd'),
    loanAmount: '',
    emiAmount: '',
    totalEmis: '',
    emiDate: '1',
  });

  // Fetch vehicles
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/vehicles');
      const data = await res.json();
      return data.data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add loan');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-reminders'] });
      onOpenChange(false);
      // Reset form
      setFormData({
        vehicleId: '',
        vehicleNumber: '',
        financeName: '',
        accountName: '',
        loanStartDate: format(new Date(), 'yyyy-MM-dd'),
        loanAmount: '',
        emiAmount: '',
        totalEmis: '',
        emiDate: '1',
      });
    },
  });

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehiclesData?.find((v: any) => v._id === vehicleId);
    setFormData({
      ...formData,
      vehicleId,
      vehicleNumber: vehicle?.vehicleNumber || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      vehicleId: formData.vehicleId,
      vehicleNumber: formData.vehicleNumber,
      financeName: formData.financeName,
      accountName: formData.accountName,
      loanStartDate: formData.loanStartDate,
      loanAmount: formData.loanAmount ? parseFloat(formData.loanAmount) : undefined,
      emiAmount: parseFloat(formData.emiAmount),
      totalEmis: formData.totalEmis ? parseInt(formData.totalEmis) : undefined,
      emiDate: parseInt(formData.emiDate),
    });
  };

  const emiDates = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Loan Record</DialogTitle>
          <DialogDescription>
            Record a new vehicle loan. The system will generate EMI payment schedules.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle *</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={handleVehicleChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiclesData?.map((vehicle: any) => (
                      <SelectItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.vehicleNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  placeholder="Auto-filled from vehicle"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="financeName">Finance Name *</Label>
                <Input
                  id="financeName"
                  value={formData.financeName}
                  onChange={(e) => setFormData({ ...formData, financeName: e.target.value })}
                  placeholder="e.g., IDFC Finance"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., Mayaa Enterprises"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="emiDate">EMI Date (Day of Month) *</Label>
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                  placeholder="Optional"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emiAmount">EMI Amount *</Label>
                <Input
                  id="emiAmount"
                  type="number"
                  value={formData.emiAmount}
                  onChange={(e) => setFormData({ ...formData, emiAmount: e.target.value })}
                  placeholder="e.g., 25000"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalEmis">Total EMIs</Label>
                <Input
                  id="totalEmis"
                  type="number"
                  value={formData.totalEmis}
                  onChange={(e) => setFormData({ ...formData, totalEmis: e.target.value })}
                  placeholder="Optional"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to add EMIs manually
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Loan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

