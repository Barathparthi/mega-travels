'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { FormSkeleton } from '@/components/shared/skeletons';
import { ErrorPage } from '@/components/shared/error-page';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { billingRulesSchema } from '@/lib/validations/settings.schema';

type BillingFormData = z.infer<typeof billingRulesSchema>;

export function BillingRulesSettings() {
    const { data: settings, isLoading, error } = useSettings('billing');
    const { mutate: updateSettings, isPending } = useUpdateSettings();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<BillingFormData>({
        resolver: zodResolver(billingRulesSchema),
        values: settings || {},
    });

    const baseDays = watch('billing.baseDays');
    const baseKms = watch('billing.baseKms');
    const baseHours = watch('billing.baseHoursPerDay');

    const onSubmit = (data: BillingFormData) => {
        updateSettings({ category: 'billing', settings: data });
    };

    if (isLoading) return <FormSkeleton />;
    if (error) return <ErrorPage message="Failed to load billing rules" />;

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>Client Billing Rules</CardTitle>
                    <CardDescription>
                        These are the default rules for client billing. Vehicle-specific
                        rates are configured in Vehicle Types.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Info Alert */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            These base values determine when extra charges apply. Actual rates
                            are set per vehicle type.
                        </AlertDescription>
                    </Alert>

                    {/* Base Days */}
                    <div className="space-y-2">
                        <Label htmlFor="billing.baseDays">
                            Base Days (included in monthly rental)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="billing.baseDays"
                                type="number"
                                {...register('billing.baseDays', { valueAsNumber: true })}
                                min={1}
                                max={31}
                                className="max-w-xs"
                            />
                            <span className="text-sm text-gray-500">days</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            ℹ️ Days above {baseDays || 20} will be charged as extra days
                        </p>
                        {errors['billing.baseDays'] && (
                            <p className="text-sm text-red-500">
                                {errors['billing.baseDays'].message}
                            </p>
                        )}
                    </div>

                    {/* Base Kilometers */}
                    <div className="space-y-2">
                        <Label htmlFor="billing.baseKms">
                            Base Kilometers (included in monthly rental)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="billing.baseKms"
                                type="number"
                                {...register('billing.baseKms', { valueAsNumber: true })}
                                min={0}
                                className="max-w-xs"
                            />
                            <span className="text-sm text-gray-500">km</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            ℹ️ KMs above {baseKms?.toLocaleString() || '2,000'} will be charged as extra KMs
                        </p>
                        {errors['billing.baseKms'] && (
                            <p className="text-sm text-red-500">
                                {errors['billing.baseKms'].message}
                            </p>
                        )}
                    </div>

                    {/* Base Hours Per Day */}
                    <div className="space-y-2">
                        <Label htmlFor="billing.baseHoursPerDay">
                            Base Hours Per Day (included in daily rental)
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="billing.baseHoursPerDay"
                                type="number"
                                {...register('billing.baseHoursPerDay', { valueAsNumber: true })}
                                min={1}
                                max={24}
                                className="max-w-xs"
                            />
                            <span className="text-sm text-gray-500">hours</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            ℹ️ Hours above {baseHours || 10} per day will be charged as extra hours
                        </p>
                        {errors['billing.baseHoursPerDay'] && (
                            <p className="text-sm text-red-500">
                                {errors['billing.baseHoursPerDay'].message}
                            </p>
                        )}
                    </div>

                    {/* Warning Alert */}
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            ⚠️ Changing these values will affect all future billing
                            calculations. Existing bills will not be modified.
                        </AlertDescription>
                    </Alert>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-brand-red hover:bg-brand-red/90"
                        >
                            {isPending ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>💾 Save Rules</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
