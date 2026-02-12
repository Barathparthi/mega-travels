'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

export default function NewDriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    assignedVehicleId: '',
  });
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedPassengers, setSelectedPassengers] = useState('');

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/vehicles');
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      return data.data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'driver',
          phone: formData.phoneNumber, // Backend expects 'phone'
          address: undefined, // Ensure address is not sent or ignored
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Driver created successfully');
        router.push('/admin/drivers');
      } else {
        toast.error(data.message || 'Failed to create driver');
      }
    } catch (error) {
      console.error('Create driver error:', error);
      toast.error('Failed to create driver');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleVehicleChange = (vehicleId: string) => {
    setFormData(prev => ({ ...prev, assignedVehicleId: vehicleId }));
    const vehicle = vehicles?.find((v: any) => v._id === vehicleId);
    setSelectedRoute(vehicle?.routeName || 'Not Assigned');
    setSelectedPassengers(vehicle?.driverPassengers || 'Not Assigned');
  };

  return (
    <div>
      <PageHeader
        title="Add New Driver"
        subtitle="Create a new driver account"
        action={
          <Link href="/admin/drivers">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drivers
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter driver's full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="driver@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+91 1234567890"
                  required
                />
              </div>

              {/* Replaced Address with Vehicle/Route */}
              <div className="space-y-2">
                <Label htmlFor="vehicle">Assigned Vehicle</Label>
                <Select
                  value={formData.assignedVehicleId}
                  onValueChange={handleVehicleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((v: any) => (
                      <SelectItem key={v._id} value={v._id}>
                        {v.vehicleNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverPassengers">Driver Passenger</Label>
                <Input
                  id="driverPassengers"
                  value={selectedPassengers}
                  disabled
                  placeholder="Auto-filled from vehicle"
                  className="bg-gray-50 text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route">Route</Label>
                <Input
                  id="route"
                  value={selectedRoute}
                  disabled
                  placeholder="Auto-filled from vehicle"
                  className="bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/drivers">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Driver'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
