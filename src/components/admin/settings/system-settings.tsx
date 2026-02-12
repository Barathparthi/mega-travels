'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Download, Database, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { FormSkeleton } from '@/components/shared/skeletons';
import { ErrorPage } from '@/components/shared/error-page';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { systemSettingsSchema } from '@/lib/validations/settings.schema';
import { toast } from 'sonner';

type SystemFormData = z.infer<typeof systemSettingsSchema>;

export function SystemSettings() {
    const { data: settings, isLoading, error } = useSettings('system');
    const { mutate: updateSettings, isPending } = useUpdateSettings();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<SystemFormData>({
        resolver: zodResolver(systemSettingsSchema),
        values: settings || {},
    });

    const tripsheetPrefix = watch('system.tripsheetPrefix') || 'TS';
    const billPrefix = watch('system.billPrefix') || 'BILL';
    const salaryPrefix = watch('system.salaryPrefix') || 'SAL';
    const emailOnSubmit = watch('system.emailOnSubmit');
    const emailOnBill = watch('system.emailOnBill');
    const dailySummary = watch('system.dailySummary');

    const [isExporting, setIsExporting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    const onSubmit = (data: SystemFormData) => {
        updateSettings({ category: 'system', settings: data });
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const res = await fetch('/api/admin/settings/export');
            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fleet-management-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Data exported successfully!');
        } catch (error) {
            toast.error('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const handleBackup = async () => {
        try {
            setIsBackingUp(true);
            const res = await fetch('/api/admin/settings/backup', { method: 'POST' });
            if (!res.ok) throw new Error('Backup failed');

            toast.success('Backup initiated successfully!');
        } catch (error) {
            toast.error('Failed to create backup');
        } finally {
            setIsBackingUp(false);
        }
    };

    if (isLoading) return <FormSkeleton />;
    if (error) return <ErrorPage message="Failed to load system settings" />;

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Number Formats */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">NUMBER FORMATS</h3>

                        <div className="space-y-2">
                            <Label htmlFor="system.tripsheetPrefix">Tripsheet Number Prefix</Label>
                            <Input
                                id="system.tripsheetPrefix"
                                {...register('system.tripsheetPrefix')}
                                maxLength={10}
                                className="max-w-xs"
                            />
                            <p className="text-sm text-gray-500">
                                Preview: {tripsheetPrefix}-2025-0001
                            </p>
                            {errors['system.tripsheetPrefix'] && (
                                <p className="text-sm text-red-500">
                                    {errors['system.tripsheetPrefix'].message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="system.billPrefix">Bill Number Prefix</Label>
                            <Input
                                id="system.billPrefix"
                                {...register('system.billPrefix')}
                                maxLength={10}
                                className="max-w-xs"
                            />
                            <p className="text-sm text-gray-500">
                                Preview: {billPrefix}-2025-0001
                            </p>
                            {errors['system.billPrefix'] && (
                                <p className="text-sm text-red-500">
                                    {errors['system.billPrefix'].message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="system.salaryPrefix">Salary ID Prefix</Label>
                            <Input
                                id="system.salaryPrefix"
                                {...register('system.salaryPrefix')}
                                maxLength={10}
                                className="max-w-xs"
                            />
                            <p className="text-sm text-gray-500">
                                Preview: {salaryPrefix}-2025-0001
                            </p>
                            {errors['system.salaryPrefix'] && (
                                <p className="text-sm text-red-500">
                                    {errors['system.salaryPrefix'].message}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr />

                    {/* Notifications */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">NOTIFICATIONS</h3>

                        <div className="space-y-2">
                            <Label htmlFor="system.adminEmail">Admin Email for Alerts</Label>
                            <Input
                                id="system.adminEmail"
                                {...register('system.adminEmail')}
                                type="email"
                                placeholder="admin@mayaaenterprises.com"
                                className="max-w-md"
                            />
                            {errors['system.adminEmail'] && (
                                <p className="text-sm text-red-500">
                                    {errors['system.adminEmail'].message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="system.emailOnSubmit"
                                    checked={emailOnSubmit}
                                    onCheckedChange={(checked) =>
                                        setValue('system.emailOnSubmit', !!checked)
                                    }
                                />
                                <label
                                    htmlFor="system.emailOnSubmit"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    ☑️ Email when tripsheet is submitted
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="system.emailOnBill"
                                    checked={emailOnBill}
                                    onCheckedChange={(checked) =>
                                        setValue('system.emailOnBill', !!checked)
                                    }
                                />
                                <label
                                    htmlFor="system.emailOnBill"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    ☑️ Email when bill is generated
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="system.dailySummary"
                                    checked={dailySummary}
                                    onCheckedChange={(checked) =>
                                        setValue('system.dailySummary', !!checked)
                                    }
                                />
                                <label
                                    htmlFor="system.dailySummary"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    ☐ Daily summary email
                                </label>
                            </div>
                        </div>
                    </div>

                    <hr />

                    {/* Data Management */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">DATA MANAGEMENT</h3>
                        <div className="flex flex-wrap gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        📥 Export All Data
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBackup}
                                disabled={isBackingUp}
                            >
                                {isBackingUp ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Backing up...
                                    </>
                                ) : (
                                    <>
                                        <Database className="w-4 h-4 mr-2" />
                                        🔄 Backup Database
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500">
                            Export downloads all system data as JSON. Backup creates a database snapshot.
                        </p>
                    </div>

                    <hr />

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
                                <>💾 Save Settings</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
