'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Loader2, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/utils/indian-number-format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EditServiceModal } from './edit-service-modal';
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

interface VehicleService {
  _id: string;
  vehicleId: {
    _id: string;
    vehicleNumber: string;
    description?: string;
  };
  serviceType: string;
  serviceDate: string;
  serviceKm: number;
  nextServiceKm?: number;
  serviceIntervalKm?: number;
  cost?: number;
  serviceProvider?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function ServiceTable() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [editService, setEditService] = useState<VehicleService | null>(null);
  const [deleteService, setDeleteService] = useState<VehicleService | null>(null);
  const queryClient = useQueryClient();

  // Fetch vehicles for filter
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/vehicles');
      const data = await res.json();
      return data.data || [];
    },
  });

  // Fetch services
  const { data, isLoading, error } = useQuery({
    queryKey: ['services', selectedVehicle],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedVehicle !== 'all') {
        params.append('vehicleId', selectedVehicle);
      }
      const res = await fetch(`/api/admin/services?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete service');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-reminders'] });
      setDeleteService(null);
    },
  });

  const services: VehicleService[] = data?.data || [];

  const handleDelete = () => {
    if (deleteService) {
      deleteMutation.mutate(deleteService._id);
    }
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service History
            </CardTitle>
            <div className="w-[250px]">
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehiclesData?.map((vehicle: any) => (
                    <SelectItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.vehicleNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No service records found</p>
              <p className="text-sm mt-1">Add a service record to get started</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Service Date</TableHead>
                      <TableHead className="text-right">Service KM</TableHead>
                      <TableHead className="text-right">Next Service KM</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service._id}>
                        <TableCell className="font-medium">
                          {service.vehicleId?.vehicleNumber || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.serviceType}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(service.serviceDate), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatIndianNumber(service.serviceKm)}
                        </TableCell>
                        <TableCell className="text-right">
                          {service.nextServiceKm ? (
                            <span className="text-orange-600 font-medium">
                              {formatIndianNumber(service.nextServiceKm)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {service.cost ? formatIndianCurrency(service.cost) : '-'}
                        </TableCell>
                        <TableCell>
                          {service.serviceProvider || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditService(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteService(service)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editService && (
        <EditServiceModal
          open={!!editService}
          onOpenChange={(open) => !open && setEditService(null)}
          service={editService}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteService} onOpenChange={(open) => !open && setDeleteService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

