'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Car } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TableSkeleton } from '@/components/shared/skeletons';
import { ErrorPage } from '@/components/shared/error-page';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency } from '@/lib/utils/calculations';
import { EditVehicleTypeModal } from './edit-vehicle-type-modal';

export function VehicleTypesSettings() {
    const [editingType, setEditingType] = useState<any>(null);
    const queryClient = useQueryClient();

    const { data: vehicleTypes, isLoading, error, refetch } = useQuery({
        queryKey: ['vehicle-types'],
        queryFn: async () => {
            const res = await fetch('/api/admin/vehicle-types');
            if (!res.ok) throw new Error('Failed to fetch vehicle types');
            const data = await res.json();
            return data.data;
        },
    });

    if (isLoading) return <TableSkeleton rows={3} columns={4} />;
    if (error) return <ErrorPage message="Failed to load vehicle types" />;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vehicle Types</CardTitle>
                <Button className="bg-brand-red hover:bg-brand-red/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Type
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {!vehicleTypes || vehicleTypes.length === 0 ? (
                    <EmptyState
                        icon={Car}
                        title="No Vehicle Types"
                        description="Add vehicle types to configure billing rates"
                        action={{
                            label: 'Add Vehicle Type',
                            onClick: () => { },
                        }}
                    />
                ) : (
                    vehicleTypes.map((type: any) => (
                        <div
                            key={type._id}
                            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Car className="w-5 h-5 text-gray-600" />
                                        <h3 className="font-semibold text-lg">{type.name}</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingType(type)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p>
                                            <span className="font-medium">Code:</span> {type.code}
                                        </p>
                                        <p>
                                            <span className="font-medium">Base Amount:</span>{' '}
                                            {formatCurrency(type.billingRules?.baseAmount || 0)} (
                                            {type.billingRules?.baseDays || 20} days)
                                        </p>
                                        <p>
                                            <span className="font-medium">Extra Day:</span>{' '}
                                            {formatCurrency(type.billingRules?.extraDayRate || 0)}/day |{' '}
                                            <span className="font-medium">Extra KM:</span>{' '}
                                            {formatCurrency(type.billingRules?.extraKmRate || 0)}/km |{' '}
                                            <span className="font-medium">Extra Hour:</span>{' '}
                                            {formatCurrency(type.billingRules?.extraHourRate || 0)}/hr
                                        </p>
                                        <p>
                                            <span className="font-medium">Status:</span>{' '}
                                            {type.isActive ? (
                                                <span className="text-green-600">✅ Active</span>
                                            ) : (
                                                <span className="text-gray-400">⭕ Inactive</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {vehicleTypes && vehicleTypes.length > 0 && (
                    <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500">
                            <strong>Note:</strong> Changes to rates will only apply to NEW
                            tripsheets/bills. Existing calculations will not be affected.
                        </p>
                    </div>
                )}
            </CardContent>

            {/* Edit Modal */}
            {editingType && (
                <EditVehicleTypeModal
                    vehicleType={editingType}
                    open={!!editingType}
                    onOpenChange={(open) => !open && setEditingType(null)}
                    onSuccess={() => {
                        refetch();
                        queryClient.invalidateQueries({ queryKey: ['vehicle-types'] });
                    }}
                />
            )}
        </Card>
    );
}
