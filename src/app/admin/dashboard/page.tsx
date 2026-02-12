import { format } from 'date-fns';
import { Car, Users, FileText, IndianRupee } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TodayEntriesCard } from '@/components/admin/dashboard/today-entries-card';
import { DashboardStats } from '@/components/admin/dashboard/dashboard-stats';
import { VehicleTypeBreakdown } from '@/components/admin/dashboard/vehicle-type-breakdown';
import { RecentSubmissionsCard } from '@/components/admin/dashboard/recent-submissions-card';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const today = format(new Date(), 'EEEE, MMMM dd, yyyy');

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome to Mayaa Travels Fleet Management • ${today}`}
      />

      {/* Stats Cards */}
      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Entries */}
        <TodayEntriesCard />

        {/* Recent Tripsheets */}
        <RecentSubmissionsCard />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/vehicles/new">
                  <Car className="h-5 w-5" />
                  <span className="text-sm">Add Vehicle</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/drivers/new">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Add Driver</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2">
                <Link href="/admin/reports">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">View Reports</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                disabled
              >
                <IndianRupee className="h-5 w-5" />
                <span className="text-sm">Export Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Type Breakdown */}
        <VehicleTypeBreakdown />
      </div>
    </div>
  );
}
