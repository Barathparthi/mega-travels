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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleTypeId: '',
    routeName: '',
    driverPassengers: '',
  });

  useEffect(() => {
    fetchVehicleTypes();
    fetchUserNames();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch('/api/admin/vehicle-types');
      const data = await response.json();
      if (data.success) {
        setVehicleTypes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle types:', error);
    }
  };

  const [userNames, setUserNames] = useState<any[]>([]);

  const fetchUserNames = async () => {
    try {
      const response = await fetch('/api/admin/usernames');
      const data = await response.json();
      if (data.data) {
        setUserNames(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user names:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Vehicle created successfully');
        router.push('/admin/vehicles');
      } else {
        toast.error(data.message || 'Failed to create vehicle');
      }
    } catch (error) {
      console.error('Create vehicle error:', error);
      toast.error('Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };

  const [openCombobox, setOpenCombobox] = useState(false);

  const filteredUserNames = userNames.filter((u) =>
    u.userName.toLowerCase().includes((formData.driverPassengers || '').toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div>
      <PageHeader
        title="Add New Vehicle"
        subtitle="Register a new vehicle in the fleet"
        action={
          <Link href="/admin/vehicles">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicles
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="KA01AB1234"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleTypeId">Vehicle Type *</Label>
                <Select
                  value={formData.vehicleTypeId}
                  onValueChange={(value) => handleSelectChange('vehicleTypeId', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type._id} value={type.name}>
                        {type.name} ({type.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverPassengers">UserName</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Input
                      id="driverPassengers"
                      name="driverPassengers"
                      value={formData.driverPassengers}
                      onChange={(e) => {
                        handleChange(e);
                        setOpenCombobox(true);
                      }}
                      onClick={() => setOpenCombobox(true)}
                      placeholder="Select or type user name"
                      autoComplete="off"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="max-h-[200px] overflow-y-auto bg-white rounded-md border shadow-sm">
                      {filteredUserNames.length > 0 ? (
                        filteredUserNames.map((user) => (
                          <div
                            key={user._id}
                            className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, driverPassengers: user.userName }));
                              setOpenCombobox(false);
                            }}
                          >
                            {user.userName}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No users found</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="routeName">Route</Label>
                <Input
                  id="routeName"
                  name="routeName"
                  value={formData.routeName}
                  onChange={handleChange}
                  placeholder="Enter route name"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/admin/vehicles">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Vehicle'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
