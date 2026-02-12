'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Car,
  Users,
  Receipt,
  Download,
  TrendingUp,
  BarChart3,
  Fuel,
  Loader2,
} from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';

interface QuickStats {
  revenue: number;
  trips: number;
  activeVehicles: number;
  fuelCost: number;
}

export default function ReportsPage() {
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        // Fetch dashboard stats
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success && statsData.data) {
            // Fetch monthly report for trips and fuel cost
            const currentDate = new Date();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            
            try {
              const reportRes = await fetch(`/api/admin/reports/monthly?month=${month}&year=${year}`);
              if (reportRes.ok) {
                const reportData = await reportRes.json();
                if (reportData.success && reportData.data) {
                  const report = reportData.data;
                  setQuickStats({
                    revenue: statsData.data.currentMonthRevenue || 0,
                    trips: report.stats?.totalTrips || 0,
                    activeVehicles: statsData.data.activeVehicles || 0,
                    fuelCost: report.stats?.totalFuelCost || 0,
                  });
                } else {
                  // Fallback to stats only
                  setQuickStats({
                    revenue: statsData.data.currentMonthRevenue || 0,
                    trips: 0,
                    activeVehicles: statsData.data.activeVehicles || 0,
                    fuelCost: 0,
                  });
                }
              } else {
                // Fallback to stats only
                setQuickStats({
                  revenue: statsData.data.currentMonthRevenue || 0,
                  trips: 0,
                  activeVehicles: statsData.data.activeVehicles || 0,
                  fuelCost: 0,
                });
              }
            } catch (error) {
              // Fallback to stats only
              setQuickStats({
                revenue: statsData.data.currentMonthRevenue || 0,
                trips: 0,
                activeVehicles: statsData.data.activeVehicles || 0,
                fuelCost: 0,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch quick stats:', error);
        setQuickStats({
          revenue: 0,
          trips: 0,
          activeVehicles: 0,
          fuelCost: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuickStats();
  }, []);
  const reports = [
    {
      title: 'Monthly Summary',
      description: 'Comprehensive monthly overview with revenue, expenses, and profit analysis',
      href: '/admin/reports/monthly',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Vehicle Performance',
      description: 'Track individual vehicle utilization, revenue, and maintenance costs',
      href: '/admin/reports/vehicles',
      icon: Car,
      color: 'text-green-600 bg-green-50',
    },
    {
      title: 'Driver Performance',
      description: 'Monitor driver performance, trips, earnings, and ratings',
      href: '/admin/reports/drivers',
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Billing Analysis',
      description: 'Detailed billing breakdown by components and vehicle types',
      href: '/admin/reports/billing',
      icon: Receipt,
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Comprehensive reports and data insights"
        action={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {report.description}
                    </CardDescription>
                  </div>
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={report.href}>
                  <Button className="w-full">
                    View Report
                    <BarChart3 className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
          <CardDescription>Overview of current month performance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">
                  {quickStats ? formatIndianCurrency(quickStats.revenue, { decimals: 0 }) : '₹0'}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Trips</p>
                <p className="text-2xl font-bold">{quickStats?.trips || 0}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Car className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Active Vehicles</p>
                <p className="text-2xl font-bold">{quickStats?.activeVehicles || 0}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Fuel className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Fuel Cost</p>
                <p className="text-2xl font-bold">
                  {quickStats ? formatIndianCurrency(quickStats.fuelCost, { decimals: 0 }) : '₹0'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
