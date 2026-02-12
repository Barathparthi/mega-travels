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
import { Plus, Search, Trash2, Users, Filter, Mail, Phone, Edit, Eye } from 'lucide-react';
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
import { EditDriverModal } from '@/components/admin/drivers/edit-driver-modal';
import { ViewDriverModal } from '@/components/admin/drivers/view-driver-modal';

interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  assignedVehicleId?: {
    _id: string;
    vehicleNumber: string;
    routeName?: string;
    driverPassengers?: string;
  };
  isActive: boolean;
  createdAt: string;
}

export default function DriversPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDriverId, setDeleteDriverId] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);
  const queryClient = useQueryClient();

  // Fetch drivers from User model
  const { data: drivers, isLoading, error } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?role=driver');
      if (!res.ok) throw new Error('Failed to fetch drivers');
      const data = await res.json();
      return data.data as Driver[];
    },
  });

  // Fetch vehicles for assignment dropdown
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/vehicles');
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      return data.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete driver');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Driver deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setDeleteDriverId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete driver');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Driver status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  // Filter drivers
  const filteredDrivers = drivers?.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && driver.isActive) ||
      (statusFilter === 'inactive' && !driver.isActive);

    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <TableSkeleton rows={5} columns={6} />;
  if (error) return <ErrorPage message="Failed to load drivers" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        subtitle="Manage your drivers"
        action={
          <Link href="/admin/drivers/new">
            <Button className="bg-brand-red hover:bg-brand-red/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Driver
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {!filteredDrivers || filteredDrivers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Drivers Found"
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'No drivers match your search criteria. Try adjusting your filters.'
                  : 'Get started by adding your first driver to the fleet.'
              }
              action={
                !searchQuery && statusFilter === 'all'
                  ? {
                    label: 'Add Driver',
                    onClick: () => (window.location.href = '/admin/drivers/new'),
                  }
                  : undefined
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Assigned Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-brand-red/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-brand-red" />
                          </div>
                          <span>{driver.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{driver.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{driver.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {driver.assignedVehicleId?.vehicleNumber || (
                          <span className="text-gray-400">Not Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={driver.isActive ? 'active' : 'inactive'}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({
                              id: driver._id,
                              isActive: value === 'active',
                            })
                          }
                        >
                          <SelectTrigger
                            className={`w-[120px] border-0 ${driver.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingDriver(driver)}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingDriver(driver)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDriverId(driver._id)}
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
          {filteredDrivers && filteredDrivers.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredDrivers.length} of {drivers?.length || 0} drivers
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDriverId} onOpenChange={() => setDeleteDriverId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this driver from the system. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDriverId && deleteMutation.mutate(deleteDriverId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Driver Modal */}
      <EditDriverModal
        driver={editingDriver}
        open={!!editingDriver}
        onOpenChange={(open) => !open && setEditingDriver(null)}
        vehicles={vehicles || []}
      />

      {/* View Driver Modal */}
      <ViewDriverModal
        driver={viewingDriver}
        open={!!viewingDriver}
        onOpenChange={(open) => !open && setViewingDriver(null)}
      />
    </div>
  );
}
