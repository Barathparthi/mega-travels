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
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface Driver {
    _id: string;
    name: string;
    email: string;
    phone: string;
    assignedVehicleId?: {
        _id: string;
        vehicleNumber: string;
    };
}

interface Vehicle {
    _id: string;
    vehicleNumber: string;
}

interface EditDriverModalProps {
    driver: Driver | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehicles: Vehicle[];
}

export function EditDriverModal({ driver, open, onOpenChange, vehicles }: EditDriverModalProps) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        assignedVehicleId: 'none',
    });
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Update form data when driver changes
    useEffect(() => {
        if (driver) {
            setFormData({
                email: driver.email,
                phone: driver.phone,
                assignedVehicleId: driver.assignedVehicleId?._id || 'none',
            });
        }
    }, [driver]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driver) return;

        setLoading(true);

        try {
            const response = await fetch(`/api/admin/users/${driver._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    phone: formData.phone,
                    assignedVehicleId: formData.assignedVehicleId === 'none' ? null : formData.assignedVehicleId,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Driver updated successfully');
                queryClient.invalidateQueries({ queryKey: ['drivers'] });
                onOpenChange(false);
            } else {
                toast.error(data.message || 'Failed to update driver');
            }
        } catch (error) {
            console.error('Update driver error:', error);
            toast.error('Failed to update driver');
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

    const handleChangePassword = async () => {
        if (!driver) {
            toast.error('Driver not found');
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setPasswordLoading(true);
        try {
            const response = await fetch(`/api/admin/users/${driver._id}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Password updated successfully');
                setShowChangePassword(false);
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(data.message || 'Failed to update password');
            }
        } catch (error) {
            console.error('Change password error:', error);
            toast.error('Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (!driver) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Driver Details</DialogTitle>
                    <DialogDescription>
                        Update contact information, license number, and assigned vehicle for {driver.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
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
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="1234567890"
                                required
                            />
                            <p className="text-xs text-gray-500">Enter 10-digit phone number</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assignedVehicleId">Assigned Vehicle</Label>
                            <Select
                                value={formData.assignedVehicleId}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, assignedVehicleId: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Vehicle</SelectItem>
                                    {vehicles?.map((vehicle) => (
                                        <SelectItem key={vehicle._id} value={vehicle._id}>
                                            {vehicle.vehicleNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Change Password Section */}
                        <div className="space-y-2 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Password</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowChangePassword(true)}
                                    className="flex items-center gap-2"
                                >
                                    <Lock className="h-4 w-4" />
                                    Change Password
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Click "Change Password" to set a new password for this driver
                            </p>
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

            {/* Change Password Dialog */}
            <AlertDialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change Password</AlertDialogTitle>
                        <AlertDialogDescription>
                            Set a new password for {driver.name}. The password must be at least 6 characters long.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password *</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="pr-10"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Minimum 6 characters</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                minLength={6}
                            />
                        </div>

                        {newPassword && confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-sm text-red-600">Passwords do not match</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setNewPassword('');
                                setConfirmPassword('');
                                setShowPassword(false);
                            }}
                            disabled={passwordLoading}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleChangePassword}
                            disabled={passwordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                            className="bg-brand-red hover:bg-red-700"
                        >
                            {passwordLoading ? 'Updating...' : 'Update Password'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
}
