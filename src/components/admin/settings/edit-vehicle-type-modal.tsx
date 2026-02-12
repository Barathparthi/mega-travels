'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { vehicleTypeSchema } from '@/lib/validations/settings.schema';
import { toast } from 'sonner';

type VehicleTypeFormData = z.infer<typeof vehicleTypeSchema>;

interface EditVehicleTypeModalProps {
    vehicleType: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditVehicleTypeModal({
    vehicleType,
    open,
    onOpenChange,
    onSuccess,
}: EditVehicleTypeModalProps) {
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VehicleTypeFormData>({
        resolver: zodResolver(vehicleTypeSchema),
        defaultValues: vehicleType,
    });

    const onSubmit = async (data: VehicleTypeFormData) => {
        try {
            setIsSaving(true);
            const res = await fetch(`/api/admin/vehicle-types/${vehicleType._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error('Failed to update vehicle type');

            toast.success('Vehicle type updated successfully!');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to update vehicle type');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Vehicle Type</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input id="name" {...register('name')} />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Code <span className="text-red-500">*</span>
                            </Label>
                            <Input id="code" {...register('code')} disabled />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">BILLING RATES</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="baseAmount">Base Amount (₹)</Label>
                                <Input
                                    id="baseAmount"
                                    type="number"
                                    {...register('billingRules.baseAmount', { valueAsNumber: true })}
                                />
                                {errors.billingRules?.baseAmount && (
                                    <p className="text-sm text-red-500">
                                        {errors.billingRules.baseAmount.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="baseDays">Base Days</Label>
                                <Input
                                    id="baseDays"
                                    type="number"
                                    {...register('billingRules.baseDays', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="extraDayRate">Extra Day Rate (₹)</Label>
                                <Input
                                    id="extraDayRate"
                                    type="number"
                                    {...register('billingRules.extraDayRate', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="extraKmRate">Extra KM Rate (₹)</Label>
                                <Input
                                    id="extraKmRate"
                                    type="number"
                                    {...register('billingRules.extraKmRate', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="baseKms">Base KMs</Label>
                                <Input
                                    id="baseKms"
                                    type="number"
                                    {...register('billingRules.baseKms', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="baseHoursPerDay">Base Hours/Day</Label>
                                <Input
                                    id="baseHoursPerDay"
                                    type="number"
                                    {...register('billingRules.baseHoursPerDay', { valueAsNumber: true })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="extraHourRate">Extra Hour Rate (₹)</Label>
                                <Input
                                    id="extraHourRate"
                                    type="number"
                                    {...register('billingRules.extraHourRate', { valueAsNumber: true })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="bg-brand-red hover:bg-brand-red/90"
                        >
                            {isSaving ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
