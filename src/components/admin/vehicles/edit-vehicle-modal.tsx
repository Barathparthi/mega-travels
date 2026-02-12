'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Vehicle {
    _id: string;
    vehicleNumber: string;
    vehicleTypeId: {
        _id: string;
        name: string;
        code: string;
    } | string;
    routeName?: string;
    driverPassengers?: string;
    status: string;
}

interface VehicleType {
    _id: string;
    name: string;
    code: string;
}

interface UserName {
    _id: string;
    userName: string;
}

interface DriverData {
    _id: string;
    driverName: string;
    phoneNumber: string;
}

interface EditVehicleModalProps {
    vehicle: Vehicle | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicleTypes: VehicleType[];
}

export function EditVehicleModal({ vehicle, open, onOpenChange, vehicleTypes }: EditVehicleModalProps) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        vehicleNumber: '',
        vehicleTypeId: '',
        routeName: '',
        driverPassengers: '',
    });

    const [userNames, setUserNames] = useState<UserName[]>([]);
    const [drivers, setDrivers] = useState<DriverData[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);

    // Fetch user names and drivers when modal opens
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch usernames
                const usernamesResponse = await fetch('/api/admin/usernames');
                const usernamesData = await usernamesResponse.json();
                if (usernamesData.data) {
                    setUserNames(usernamesData.data);
                }

                // Fetch drivers
                const driversResponse = await fetch('/api/admin/drivers-data');
                const driversData = await driversResponse.json();
                if (driversData.success && driversData.data) {
                    setDrivers(driversData.data);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        if (open) {
            fetchData();
        }
    }, [open]);

    const filteredUserNames = userNames.filter((u) =>
        u.userName.toLowerCase().includes((formData.driverPassengers || '').toLowerCase())
    );

    // Update form data when vehicle changes
    useEffect(() => {
        if (vehicle) {
            setFormData({
                vehicleNumber: vehicle.vehicleNumber,
                // Use name if populated object, or use raw string. This aligns with DB using names as FK.
                vehicleTypeId: typeof vehicle.vehicleTypeId === 'string' ? vehicle.vehicleTypeId : (vehicle.vehicleTypeId as any).name,
                routeName: vehicle.routeName || '',
                driverPassengers: vehicle.driverPassengers || '',
            });
        }
    }, [vehicle]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicle) return;

        setLoading(true);

        try {
            const response = await fetch(`/api/admin/vehicles/${vehicle._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Vehicle updated successfully');
                queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                onOpenChange(false);
            } else {
                toast.error(data.message || 'Failed to update vehicle');
            }
        } catch (error) {
            console.error('Update vehicle error:', error);
            toast.error('Failed to update vehicle');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSelectChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            vehicleTypeId: value,
        }));
    };

    if (!vehicle) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Vehicle Details</DialogTitle>
                    <DialogDescription>
                        Update vehicle information
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="vehicleNumber">Vehicle Number</Label>
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
                            <Label htmlFor="vehicleTypeId">Vehicle Type</Label>
                            <Select
                                value={formData.vehicleTypeId}
                                onValueChange={handleSelectChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select vehicle type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicleTypes?.map((type) => (
                                        <SelectItem key={type._id} value={type.name}>
                                            {type.name} ({type.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="driverPassengers">UserName</Label>
                            <div className="relative">
                                <Input
                                    id="driverPassengers"
                                    name="driverPassengers"
                                    value={formData.driverPassengers}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setOpenCombobox(true);
                                    }}
                                    onFocus={() => setOpenCombobox(true)}
                                    placeholder="Select or type user name"
                                    autoComplete="off"
                                />
                                {openCombobox && filteredUserNames.length > 0 && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setOpenCombobox(false)}
                                        />
                                        <div className="absolute z-50 w-full mt-1 bg-white rounded-md border shadow-lg max-h-[200px] overflow-y-auto">
                                            <div className="py-1">
                                                {filteredUserNames.map((user) => (
                                                    <div
                                                        key={user._id}
                                                        className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer select-none"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setFormData((prev) => ({ ...prev, driverPassengers: user.userName }));
                                                            setOpenCombobox(false);
                                                        }}
                                                    >
                                                        {user.userName}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
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

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
