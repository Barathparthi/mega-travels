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
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SERVICE_TYPES = [
  'Oil Service',
  'Full Service',
  'Engine Service',
  'Tire Replacement',
  'Battery Replacement',
  'Brake Service',
  'AC Service',
  'Other',
];

export function AddServiceModal({ open, onOpenChange }: AddServiceModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: 'Oil Service',
    serviceDate: format(new Date(), 'yyyy-MM-dd'),
    serviceKm: '',
    serviceIntervalKm: '10000',
    cost: '',
    serviceProvider: '',
    notes: '',
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
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add service');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-reminders'] });
      onOpenChange(false);
      // Reset form
      setFormData({
        vehicleId: '',
        serviceType: 'Oil Service',
        serviceDate: format(new Date(), 'yyyy-MM-dd'),
        serviceKm: '',
        serviceIntervalKm: '10000',
        cost: '',
        serviceProvider: '',
        notes: '',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      vehicleId: formData.vehicleId,
      serviceType: formData.serviceType,
      serviceDate: formData.serviceDate,
      serviceKm: parseInt(formData.serviceKm),
      serviceIntervalKm: parseInt(formData.serviceIntervalKm),
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      serviceProvider: formData.serviceProvider || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service Record</DialogTitle>
          <DialogDescription>
            Record a new vehicle service. The system will track when the next service is due.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle *</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
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
                <Label htmlFor="serviceType">Service Type *</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Service Date *</Label>
                <Input
                  id="serviceDate"
                  type="date"
                  value={formData.serviceDate}
                  onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceKm">Service KM Reading *</Label>
                <Input
                  id="serviceKm"
                  type="number"
                  value={formData.serviceKm}
                  onChange={(e) => setFormData({ ...formData, serviceKm: e.target.value })}
                  placeholder="e.g., 50000"
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceIntervalKm">Service Interval (KM)</Label>
                <Input
                  id="serviceIntervalKm"
                  type="number"
                  value={formData.serviceIntervalKm}
                  onChange={(e) => setFormData({ ...formData, serviceIntervalKm: e.target.value })}
                  placeholder="e.g., 10000"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Default: 10,000 km. Next service will be calculated automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Service Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="Optional"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceProvider">Service Provider</Label>
              <Input
                id="serviceProvider"
                value={formData.serviceProvider}
                onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                placeholder="e.g., ABC Auto Service"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the service..."
                rows={3}
              />
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
              Add Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

