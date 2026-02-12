'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { FormSkeleton } from '@/components/shared/skeletons';
import { ErrorPage } from '@/components/shared/error-page';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { salaryRulesSchema } from '@/lib/validations/settings.schema';
import { formatCurrency } from '@/lib/utils/calculations';

type SalaryFormData = z.infer<typeof salaryRulesSchema>;

export function SalaryRulesSettings() {
    const { data: settings, isLoading, error } = useSettings('salary');
    const { mutate: updateSettings, isPending } = useUpdateSettings();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<SalaryFormData>({
        resolver: zodResolver(salaryRulesSchema),
        values: settings || {},
    });

    const baseSalary = watch('salary.baseSalary') || 20000;
    const baseDays = watch('salary.baseDays') || 22;
    const baseHours = watch('salary.baseHoursPerDay') || 12;
    const extraDayRate = watch('salary.extraDayRate') || 909;
    const extraHourRate = watch('salary.extraHourRate') || 80;

    // Example calculation
    const exampleDays = 26;
    const exampleHours = 340;
    const exampleExtraDays = Math.max(0, exampleDays - baseDays);
    const exampleExtraHours = Math.max(0, exampleHours - exampleDays * baseHours);
    const exampleTotal =
        baseSalary + exampleExtraDays * extraDayRate + exampleExtraHours * extraHourRate;

    const onSubmit = (data: SalaryFormData) => {
        updateSettings({ category: 'salary', settings: data });
    };

    if (isLoading) return <FormSkeleton />;
    if (error) return <ErrorPage message="Failed to load salary rules" />;

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Driver Salary Rules</CardTitle>
                            <CardDescription>
                                These rules apply to all driver salary calculations.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Lock className="w-4 h-4" />
                            <span>Internal</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Base Salary */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">BASE SALARY</h3>

                        <div className="space-y-2">
                            <Label htmlFor="salary.baseSalary">Base Salary Amount (₹)</Label>
                            <Input
                                id="salary.baseSalary"
                                type="number"
                                {...register('salary.baseSalary', { valueAsNumber: true })}
                                min={0}
                                className="max-w-xs"
                            />
                            {errors['salary.baseSalary'] && (
                                <p className="text-sm text-red-500">
                                    {errors['salary.baseSalary'].message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary.baseDays">
                                Base Working Days (included in base salary)
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="salary.baseDays"
                                    type="number"
                                    {...register('salary.baseDays', { valueAsNumber: true })}
                                    min={1}
                                    max={31}
                                    className="max-w-xs"
                                />
                                <span className="text-sm text-gray-500">days</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                ℹ️ Working days above {baseDays} will be paid as extra days
                            </p>
                            {errors['salary.baseDays'] && (
                                <p className="text-sm text-red-500">
                                    {errors['salary.baseDays'].message}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr />

                    {/* Extra Day Payment */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">EXTRA DAY PAYMENT</h3>

                        <div className="space-y-2">
                            <Label htmlFor="salary.extraDayRate">Extra Day Rate (₹ per day)</Label>
                            <Input
                                id="salary.extraDayRate"
                                type="number"
                                {...register('salary.extraDayRate', { valueAsNumber: true })}
                                min={0}
                                className="max-w-xs"
                            />
                            <p className="text-sm text-gray-500">
                                ℹ️ Paid for each working day beyond {baseDays} days
                            </p>
                            {errors['salary.extraDayRate'] && (
                                <p className="text-sm text-red-500">
                                    {errors['salary.extraDayRate'].message}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr />

                    {/* Extra Hours Payment */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">EXTRA HOURS PAYMENT</h3>

                        <div className="space-y-2">
                            <Label htmlFor="salary.baseHoursPerDay">
                                Base Hours Per Day (included in salary)
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="salary.baseHoursPerDay"
                                    type="number"
                                    {...register('salary.baseHoursPerDay', { valueAsNumber: true })}
                                    min={1}
                                    max={24}
                                    className="max-w-xs"
                                />
                                <span className="text-sm text-gray-500">hours</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                ℹ️ Hours above {baseHours} per day will be paid as overtime
                            </p>
                            {errors['salary.baseHoursPerDay'] && (
                                <p className="text-sm text-red-500">
                                    {errors['salary.baseHoursPerDay'].message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salary.extraHourRate">Extra Hour Rate (₹ per hour)</Label>
                            <Input
                                id="salary.extraHourRate"
                                type="number"
                                {...register('salary.extraHourRate', { valueAsNumber: true })}
                                min={0}
                                className="max-w-xs"
                            />
                            <p className="text-sm text-gray-500">
                                ℹ️ Same rate for all vehicle types
                            </p>
                            {errors['salary.extraHourRate'] && (
                                <p className="text-sm text-red-500">
                                    {errors['salary.extraHourRate'].message}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr />

                    {/* Calculation Preview */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">CALCULATION PREVIEW</h3>
                        <p className="text-sm text-gray-600">
                            Example: Driver works {exampleDays} days, {exampleHours} hours (avg{' '}
                            {(exampleHours / exampleDays).toFixed(2)} hrs/day)
                        </p>

                        <Alert>
                            <AlertDescription>
                                <div className="space-y-2 font-mono text-sm">
                                    <div className="flex justify-between">
                                        <span>Base Salary ({baseDays} days)</span>
                                        <span>{formatCurrency(baseSalary)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>
                                            Extra Days: {exampleExtraDays} days × {formatCurrency(extraDayRate)}
                                        </span>
                                        <span>{formatCurrency(exampleExtraDays * extraDayRate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>
                                            Extra Hours: {exampleExtraHours} hrs × {formatCurrency(extraHourRate)}
                                        </span>
                                        <span>{formatCurrency(exampleExtraHours * extraHourRate)}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-bold">
                                        <span>Total Salary</span>
                                        <span>{formatCurrency(exampleTotal)}</span>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>

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
