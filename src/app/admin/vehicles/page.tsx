'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Trash2, Car, Filter, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { TableSkeleton } from '@/components/shared/skeletons';
import { ErrorPage } from '@/components/shared/error-page';
import { EmptyState } from '@/components/shared/empty-state';
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
import { EditVehicleModal } from '@/components/admin/vehicles/edit-vehicle-modal';
import { ViewVehicleModal } from '@/components/admin/vehicles/view-vehicle-modal';

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  vehicleTypeId: string;
  vehicleType?: {
    _id: string;
    name: string;
    code: string;
  };
  assignedDriverId?: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  createdAt: string;
  routeName?: string;
  driverPassengers?: string;
}

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/vehicles');
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      return data.data as Vehicle[];
    },
  });

  // Fetch vehicle types for filter
  const { data: vehicleTypes } = useQuery({
    queryKey: ['vehicle-types'],
    queryFn: async () => {
      const res = await fetch('/api/admin/vehicle-types');
      if (!res.ok) throw new Error('Failed to fetch vehicle types');
      const data = await res.json();
      return data.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/vehicles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete vehicle');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDeleteVehicleId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vehicle');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Vehicle status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  // Filter vehicles
  const filteredVehicles = vehicles?.filter((vehicle) => {
    const typeName = vehicle.vehicleType?.name || vehicle.vehicleTypeId || '';
    const matchesSearch =
      vehicle.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      typeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.assignedDriverId?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.driverPassengers || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      vehicleTypeFilter === 'all' ||
      vehicle.vehicleType?.name === vehicleTypeFilter ||
      vehicle.vehicleTypeId === vehicleTypeFilter;

    const matchesStatus =
      statusFilter === 'all' || vehicle.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  if (isLoading) return <TableSkeleton rows={5} columns={5} />;
  if (error) return <ErrorPage message="Failed to load vehicles" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        subtitle="Manage your fleet vehicles"
        action={
          <Link href="/admin/vehicles/new">
            <Button className="bg-brand-red hover:bg-brand-red/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by vehicle number, type, or driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vehicleTypes?.map((type: any) => (
                  <SelectItem key={type._id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {!filteredVehicles || filteredVehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No Vehicles Found"
              description={
                searchQuery || vehicleTypeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No vehicles match your search criteria. Try adjusting your filters.'
                  : 'Get started by adding your first vehicle to the fleet.'
              }
              action={
                !searchQuery && vehicleTypeFilter === 'all' && statusFilter === 'all'
                  ? {
                    label: 'Add Vehicle',
                    onClick: () => (window.location.href = '/admin/vehicles/new'),
                  }
                  : undefined
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>UserName</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle._id}>
                      <TableCell className="font-medium">
                        {vehicle.vehicleNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-500" />
                          <span>
                            {vehicle.vehicleType?.name || vehicle.vehicleTypeId || 'N/A'}
                            {vehicle.vehicleType?.code && (
                              <span className="text-gray-500 ml-1">
                                ({vehicle.vehicleType.code})
                              </span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {vehicle.driverPassengers || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vehicle.assignedDriverId?.name || (
                          <span className="text-gray-400">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={vehicle.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ id: vehicle._id, status: value })
                          }
                        >
                          <SelectTrigger
                            className={`w-[140px] border-0 ${vehicle.status === 'active'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : vehicle.status === 'maintenance'
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingVehicle(vehicle)}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingVehicle(vehicle)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteVehicleId(vehicle._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          )}

          {/* Summary */}
          {filteredVehicles && filteredVehicles.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredVehicles.length} of {vehicles?.length || 0} vehicles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVehicleId} onOpenChange={() => setDeleteVehicleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this vehicle from the system. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVehicleId && deleteMutation.mutate(deleteVehicleId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        vehicle={editingVehicle}
        open={!!editingVehicle}
        onOpenChange={(open) => !open && setEditingVehicle(null)}
        vehicleTypes={vehicleTypes || []}
      />

      {/* View Vehicle Modal */}
      <ViewVehicleModal
        vehicle={viewingVehicle}
        open={!!viewingVehicle}
        onOpenChange={(open) => !open && setViewingVehicle(null)}
      />
    </div>
  );
}
