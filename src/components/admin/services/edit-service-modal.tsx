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

interface VehicleService {
  _id: string;
  vehicleId: {
    _id: string;
    vehicleNumber: string;
  };
  serviceType: string;
  serviceDate: string;
  serviceKm: number;
  nextServiceKm?: number;
  serviceIntervalKm?: number;
  cost?: number;
  serviceProvider?: string;
  notes?: string;
}

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: VehicleService;
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

export function EditServiceModal({ open, onOpenChange, service }: EditServiceModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    serviceType: service.serviceType,
    serviceDate: format(new Date(service.serviceDate), 'yyyy-MM-dd'),
    serviceKm: service.serviceKm.toString(),
    serviceIntervalKm: (service.serviceIntervalKm || 10000).toString(),
    cost: service.cost?.toString() || '',
    serviceProvider: service.serviceProvider || '',
    notes: service.notes || '',
  });

  useEffect(() => {
    if (service) {
      setFormData({
        serviceType: service.serviceType,
        serviceDate: format(new Date(service.serviceDate), 'yyyy-MM-dd'),
        serviceKm: service.serviceKm.toString(),
        serviceIntervalKm: (service.serviceIntervalKm || 10000).toString(),
        cost: service.cost?.toString() || '',
        serviceProvider: service.serviceProvider || '',
        notes: service.notes || '',
      });
    }
  }, [service]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/admin/services/${service._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update service');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-reminders'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
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
          <DialogTitle>Edit Service Record</DialogTitle>
          <DialogDescription>
            Update service details for {service.vehicleId?.vehicleNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <Input value={service.vehicleId?.vehicleNumber} disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceKm">Service KM Reading *</Label>
                <Input
                  id="serviceKm"
                  type="number"
                  value={formData.serviceKm}
                  onChange={(e) => setFormData({ ...formData, serviceKm: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceIntervalKm">Service Interval (KM)</Label>
                <Input
                  id="serviceIntervalKm"
                  type="number"
                  value={formData.serviceIntervalKm}
                  onChange={(e) => setFormData({ ...formData, serviceIntervalKm: e.target.value })}
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Service Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceProvider">Service Provider</Label>
                <Input
                  id="serviceProvider"
                  value={formData.serviceProvider}
                  onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
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
              Update Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

