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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddAdvanceSalaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAdvanceSalaryModal({ open, onOpenChange }: AddAdvanceSalaryModalProps) {
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    driverId: '',
    vehicleId: '',
    amount: '',
    requestedMonth: (currentDate.getMonth() + 1).toString(),
    requestedYear: currentDate.getFullYear().toString(),
    reason: '',
    notes: '',
  });

  // Fetch drivers
  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?role=driver');
      const data = await res.json();
      return data.data || [];
    },
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
      const res = await fetch('/api/admin/advance-salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create advance request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advance-salary'] });
      toast.success('Advance salary request created successfully');
      onOpenChange(false);
      // Reset form
      setFormData({
        driverId: '',
        vehicleId: '',
        amount: '',
        requestedMonth: (currentDate.getMonth() + 1).toString(),
        requestedYear: currentDate.getFullYear().toString(),
        reason: '',
        notes: '',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDriverChange = (driverId: string) => {
    const driver = driversData?.find((d: any) => d._id === driverId);
    const vehicleId = driver?.assignedVehicleId?._id || '';
    setFormData({
      ...formData,
      driverId,
      vehicleId: vehicleId.toString(),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehicleId || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    addMutation.mutate({
      driverId: formData.driverId,
      vehicleId: formData.vehicleId,
      amount: parseFloat(formData.amount),
      requestedMonth: parseInt(formData.requestedMonth),
      requestedYear: parseInt(formData.requestedYear),
      reason: formData.reason || undefined,
      notes: formData.notes || undefined,
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Advance Salary Request</DialogTitle>
          <DialogDescription>
            Create a new advance salary request for a driver. This amount will be deducted from their monthly salary.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driverId">Driver *</Label>
                <Select value={formData.driverId} onValueChange={handleDriverChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversData?.map((driver: any) => (
                      <SelectItem key={driver._id} value={driver._id}>
                        {driver.name} ({driver.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle *</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Advance Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter advance amount"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestedMonth">Requested For Month *</Label>
                <Select
                  value={formData.requestedMonth}
                  onValueChange={(value) => setFormData({ ...formData, requestedMonth: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-2">
                <Label htmlFor="requestedYear">Requested For Year *</Label>
                <Select
                  value={formData.requestedYear}
                  onValueChange={(value) => setFormData({ ...formData, requestedYear: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for advance request"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Advance Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

