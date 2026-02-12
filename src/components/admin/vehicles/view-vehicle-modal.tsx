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
import { Car, User, MapPin, Users } from 'lucide-react';

interface Vehicle {
    _id: string;
    vehicleNumber: string;
    vehicleTypeId: {
        _id: string;
        name: string;
        code: string;
    } | string;
    assignedDriverId?: {
        _id: string;
        name: string;
        email: string;
    };
    routeName?: string;
    driverPassengers?: string;
    status: string;
    createdAt: string;
}

interface ViewVehicleModalProps {
    vehicle: Vehicle | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ViewVehicleModal({ vehicle, open, onOpenChange }: ViewVehicleModalProps) {
    if (!vehicle) return null;

    // Helper to handle vehicleTypeId being string or object
    const getVehicleTypeName = () => {
        if (typeof vehicle.vehicleTypeId === 'string') return vehicle.vehicleTypeId;
        return vehicle.vehicleTypeId?.name;
    };

    const getVehicleTypeCode = () => {
        if (typeof vehicle.vehicleTypeId === 'string') return '';
        return vehicle.vehicleTypeId?.code;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Car className="h-5 w-5 text-brand-red" />
                        Vehicle Details
                    </DialogTitle>
                    <DialogDescription>
                        Detailed information for vehicle {vehicle.vehicleNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Status Badge */}
                    <div className="flex justify-end">
                        <Badge
                            variant={vehicle.status === 'active' ? 'default' : 'secondary'}
                            className={vehicle.status === 'active' ? 'bg-green-600' : ''}
                        >
                            {vehicle.status.toUpperCase()}
                        </Badge>
                    </div>

                    {/* Main Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500 uppercase font-bold">Vehicle Number</Label>
                            <div className="font-mono text-lg font-medium">{vehicle.vehicleNumber}</div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500 uppercase font-bold">Type</Label>
                            <div className="flex items-center gap-2">
                                <span>{getVehicleTypeName()}</span>
                                {getVehicleTypeCode() && (
                                    <Badge variant="outline" className="text-xs">{getVehicleTypeCode()}</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Route & Passengers */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-bold">Assigned Route</Label>
                                <div className="text-sm font-medium">{vehicle.routeName || 'Not Assigned'}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Users className="h-4 w-4 text-gray-500 mt-1" />
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500 uppercase font-bold">UserName</Label>
                                <div className="text-sm font-medium">{vehicle.driverPassengers || 'None'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Driver Info */}
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 uppercase font-bold">Assigned Driver</Label>
                        <div className="flex items-center p-3 border rounded-md gap-3">
                            <div className="h-8 w-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                {vehicle.assignedDriverId ? (
                                    <>
                                        <div className="text-sm font-medium">{vehicle.assignedDriverId.name}</div>
                                        <div className="text-xs text-gray-500">{vehicle.assignedDriverId.email}</div>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-400 italic">No driver assigned</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
