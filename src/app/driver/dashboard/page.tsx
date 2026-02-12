'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Calendar, CheckCircle2, User } from 'lucide-react';
import Link from 'next/link';
import { ServiceReminder } from '@/components/driver/service-reminder';

export default function DriverDashboard() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayEntry: false,
        workingDays: 0,
        totalOtt: 0,
        salary: 0
    });

    const userName = session?.user?.name?.split(' ')[0] || 'Driver';
    const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    useEffect(() => {
        // Determine if we need to fetch dashboard data
        const fetchDashboard = async () => {
            try {
                const res = await fetch('/api/driver/dashboard');
                if (res.ok) {
                    const result = await res.json();

                    if (result.success && result.data) {
                        const data = result.data;
                        const summary = data.monthSummary || {};
                        const isEntryDone = data.todayStatus && data.todayStatus !== 'pending';

                        setStats({
                            todayEntry: isEntryDone,
                            workingDays: summary.totalWorkingDays || 0,
                            totalOtt: summary.totalKms || 0,
                            salary: 0 // Salary usually not shown on dashboard directly or needs specific calc
                        });
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-gray-900">
                    Welcome, {userName}
                </h1>
                <p className="text-xs text-gray-500">{today}</p>
            </div>

            {/* Service Reminder */}
            <ServiceReminder />

            {/* Main Action - Add Entry */}
            <Card className="shadow-sm">
                <CardContent className="pt-5 pb-5 px-4 sm:px-6">
                    {stats.todayEntry ? (
                        <div className="text-center space-y-4">
                            <div className="h-14 w-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 mb-1">Entry Saved</h3>
                                <p className="text-xs text-gray-600">Today's entry is completed</p>
                            </div>
                            <Button asChild className="w-full h-12 text-base font-medium active:scale-95">
                                <Link href="/driver/tripsheet">View Tripsheet</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-gray-900">Add Today's Entry</h3>
                                <p className="text-xs text-gray-600">
                                    Enter your kilometer reading and work details
                                </p>
                            </div>
                            <Button
                                asChild
                                className="w-full h-14 bg-brand-red hover:bg-red-700 text-white text-base font-semibold active:scale-95"
                            >
                                <Link href="/driver/add-entry" className="flex items-center justify-center gap-2">
                                    <PlusCircle className="h-6 w-6" />
                                    Start Entry
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">This Month Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-semibold text-gray-900 mb-1">{stats.workingDays}</span>
                            <span className="text-xs font-medium text-gray-600">Working Days</span>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-semibold text-gray-900 mb-1">
                                {(stats.totalOtt).toLocaleString()}
                            </span>
                            <span className="text-xs font-medium text-gray-600">Total KM</span>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Navigation Cards */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>

                <Link href="/driver/tripsheet">
                    <Card className="border active:border-brand-red transition-colors cursor-pointer shadow-sm active:scale-98">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900">My Tripsheet</h4>
                                <p className="text-xs text-gray-500">View all entries</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/driver/profile">
                    <Card className="border active:border-brand-red transition-colors cursor-pointer shadow-sm active:scale-98">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <User className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900">My Profile</h4>
                                <p className="text-xs text-gray-500">Vehicle and personal info</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
