'use client';

import { useState } from 'react';
import { Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface CheckItem {
    id: string;
    label: string;
    category: string;
    check: () => Promise<boolean>;
}

const checkItems: CheckItem[] = [
    // Database
    {
        id: 'db-connection',
        label: 'Database connection working',
        category: 'Database',
        check: async () => {
            try {
                const res = await fetch('/api/admin/dashboard');
                return res.ok;
            } catch {
                return false;
            }
        },
    },

    // Authentication
    {
        id: 'admin-exists',
        label: 'Admin user exists',
        category: 'Authentication',
        check: async () => {
            try {
                const res = await fetch('/api/auth/session');
                return res.ok;
            } catch {
                return false;
            }
        },
    },

    // Vehicle Types
    {
        id: 'vehicle-types',
        label: 'Vehicle types configured',
        category: 'Data',
        check: async () => {
            try {
                const res = await fetch('/api/admin/vehicle-types');
                if (!res.ok) return false;
                const data = await res.json();
                return data.data && data.data.length > 0;
            } catch {
                return false;
            }
        },
    },

    // Settings
    {
        id: 'company-settings',
        label: 'Company settings configured',
        category: 'Settings',
        check: async () => {
            try {
                const res = await fetch('/api/admin/settings/company');
                if (!res.ok) return false;
                const data = await res.json();
                return data.data && data.data['company.name'];
            } catch {
                return false;
            }
        },
    },
    {
        id: 'billing-rules',
        label: 'Billing rules configured',
        category: 'Settings',
        check: async () => {
            try {
                const res = await fetch('/api/admin/settings/billing');
                return res.ok;
            } catch {
                return false;
            }
        },
    },
    {
        id: 'salary-rules',
        label: 'Salary rules configured',
        category: 'Settings',
        check: async () => {
            try {
                const res = await fetch('/api/admin/settings/salary');
                return res.ok;
            } catch {
                return false;
            }
        },
    },

    // System
    {
        id: 'system-settings',
        label: 'System settings configured',
        category: 'System',
        check: async () => {
            try {
                const res = await fetch('/api/admin/settings/system');
                return res.ok;
            } catch {
                return false;
            }
        },
    },
];

export function DeploymentChecklist() {
    const [results, setResults] = useState<Record<string, boolean | null>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);

    const runChecks = async () => {
        setIsRunning(true);
        setProgress(0);
        const newResults: Record<string, boolean | null> = {};

        for (let i = 0; i < checkItems.length; i++) {
            const item = checkItems[i];
            try {
                newResults[item.id] = await item.check();
            } catch {
                newResults[item.id] = false;
            }
            setResults({ ...newResults });
            setProgress(((i + 1) / checkItems.length) * 100);
        }

        setIsRunning(false);
    };

    const getIcon = (result: boolean | null | undefined) => {
        if (result === null || result === undefined) {
            return <AlertCircle className="w-5 h-5 text-gray-400" />;
        }
        return result ? (
            <Check className="w-5 h-5 text-green-600" />
        ) : (
            <X className="w-5 h-5 text-red-600" />
        );
    };

    const categories = [...new Set(checkItems.map((i) => i.category))];
    const totalChecks = checkItems.length;
    const completedChecks = Object.values(results).filter((r) => r === true).length;
    const failedChecks = Object.values(results).filter((r) => r === false).length;

    return (
        <Card>
            <CardHeader className="space-y-4">
                <div className="flex flex-row items-center justify-between">
                    <CardTitle>Deployment Checklist</CardTitle>
                    <Button onClick={runChecks} disabled={isRunning}>
                        {isRunning ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Running...
                            </>
                        ) : (
                            'Run Checks'
                        )}
                    </Button>
                </div>

                {isRunning && (
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-gray-600">
                            Checking {Math.round(progress)}%...
                        </p>
                    </div>
                )}

                {!isRunning && Object.keys(results).length > 0 && (
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{completedChecks}</p>
                            <p className="text-sm text-gray-600">Passed</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{failedChecks}</p>
                            <p className="text-sm text-gray-600">Failed</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-2xl font-bold text-gray-600">{totalChecks}</p>
                            <p className="text-sm text-gray-600">Total</p>
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {categories.map((category) => (
                    <div key={category} className="mb-6 last:mb-0">
                        <h4 className="font-medium text-gray-700 mb-2">{category}</h4>
                        <div className="space-y-2">
                            {checkItems
                                .filter((i) => i.category === category)
                                .map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                                    >
                                        {getIcon(results[item.id])}
                                        <span className="text-sm flex-1">{item.label}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}

                {!isRunning && Object.keys(results).length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                        Click "Run Checks" to verify system readiness
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
