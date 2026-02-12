'use client';

import { useEffect, useState } from 'react';
import { Car, Users, FileText, IndianRupee } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';

interface DashboardStatsData {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingTripsheets: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueChange: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setStats(data.data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch dashboard stats:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Vehicles"
          value={0}
          subtitle="Loading..."
          icon={Car}
          color="red"
        />
        <StatCard
          title="Total Drivers"
          value={0}
          subtitle="Loading..."
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Pending Tripsheets"
          value={0}
          subtitle="Loading..."
          icon={FileText}
          color="cyan"
        />
        <StatCard
          title="This Month Revenue"
          value="₹0"
          subtitle="Loading..."
          icon={IndianRupee}
          color="green"
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Vehicles"
          value={0}
          subtitle="0 Active"
          icon={Car}
          color="red"
        />
        <StatCard
          title="Total Drivers"
          value={0}
          subtitle="0 Active"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Pending Tripsheets"
          value={0}
          subtitle="Awaiting review"
          icon={FileText}
          color="cyan"
        />
        <StatCard
          title="This Month Revenue"
          value="₹0"
          subtitle="+0% from last month"
          icon={IndianRupee}
          color="green"
        />
      </div>
    );
  }

  const revenueChangeText = stats.revenueChange >= 0
    ? `+${stats.revenueChange.toFixed(1)}% from last month`
    : `${stats.revenueChange.toFixed(1)}% from last month`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatCard
        title="Total Vehicles"
        value={stats.totalVehicles}
        subtitle={`${stats.activeVehicles} Active`}
        icon={Car}
        color="red"
      />
      <StatCard
        title="Total Drivers"
        value={stats.totalDrivers}
        subtitle={`${stats.activeDrivers} Active`}
        icon={Users}
        color="purple"
      />
      <StatCard
        title="Pending Tripsheets"
        value={stats.pendingTripsheets}
        subtitle="Awaiting review"
        icon={FileText}
        color="cyan"
      />
      <StatCard
        title="Monthly Revenue"
        value={formatIndianCurrency(stats.currentMonthRevenue, { decimals: 0 })}
        subtitle={`${revenueChangeText} • All Vehicles`}
        icon={IndianRupee}
        color="green"
      />
    </div>
  );
}

