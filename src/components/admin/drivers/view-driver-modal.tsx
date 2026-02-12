'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Car, Calendar, MapPin, Users } from 'lucide-react';

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

interface ViewDriverModalProps {
    driver: Driver | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ViewDriverModal({ driver, open, onOpenChange }: ViewDriverModalProps) {
    if (!driver) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <User className="h-5 w-5 text-brand-red" />
                        Driver Profile
                    </DialogTitle>
                    <DialogDescription>
                        Detailed information for {driver.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Status Badge */}
                    <div className="flex justify-end">
                        <Badge
                            variant={driver.isActive ? 'default' : 'secondary'}
                            className={driver.isActive ? 'bg-green-600' : ''}
                        >
                            {driver.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <Mail className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-bold">Email</Label>
                                <div className="text-sm font-medium">{driver.email}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <Phone className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-bold">Phone</Label>
                                <div className="text-sm font-medium">{driver.phone}</div>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Vehicle Section */}
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 uppercase font-bold">Assignment Details</Label>
                        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <Car className="h-4 w-4 text-gray-500 mt-1" />
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500 uppercase font-bold">Assigned Vehicle</Label>
                                    <div className="text-sm font-medium">
                                        {driver.assignedVehicleId?.vehicleNumber || <span className="text-gray-400 italic">No Vehicle Assigned</span>}
                                    </div>
                                </div>
                            </div>

                            {driver.assignedVehicleId && (
                                <>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500 uppercase font-bold">Route</Label>
                                            <div className="text-sm font-medium">
                                                {driver.assignedVehicleId.routeName || 'Not Assigned'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Users className="h-4 w-4 text-gray-500 mt-1" />
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-500 uppercase font-bold">Driver Passengers</Label>
                                            <div className="text-sm font-medium">
                                                {driver.assignedVehicleId.driverPassengers || 'None'}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {new Date(driver.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
