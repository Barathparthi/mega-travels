'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Car,
  LogOut,
  Lock,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { formatCurrency, formatIndianNumber } from '@/lib/utils/calculations';
import Link from 'next/link';

interface ProfileData {
  driver: {
    name: string;
    email: string;
    phone: string;
    joinedDate: string;
  };
  vehicle: {
    vehicleNumber: string;
    vehicleType: string;
    routeName: string;
    extraHourRate: number;
  };
  salaryPreview?: {
    month: number;
    year: number;
    baseSalary: number;
    baseDays: number;
    totalWorkingDays: number;
    extraDays: number;
    extraDayRate: number;
    extraDaysAmount: number;
    totalDriverExtraHours: number;
    extraHourRate: number;
    extraHoursAmount: number;
    totalSalary: number;
    status: string;
  };
}

export default function DriverProfilePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [infoRes, salaryRes] = await Promise.all([
        fetch('/api/driver/info'),
        fetch(`/api/driver/salary-preview?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`),
      ]);

      const infoData = await infoRes.json();
      const salaryData = await salaryRes.json();

      setData({
        driver: infoData.data.driver,
        vehicle: infoData.data.vehicle,
        salaryPreview: salaryRes.ok ? salaryData.data : undefined,
      });
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 active:scale-95">
          <Link href="/driver/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-3 border-brand-red">
              <AvatarFallback className="bg-brand-red text-white text-xl sm:text-2xl font-bold">
                {session?.user?.name ? getInitials(session.user.name) : 'DR'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {data?.driver.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Driver</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Card */}
      {data?.vehicle && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-5 w-5 text-brand-red" />
              Assigned Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-brand-red/5 border border-brand-red/20 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-brand-red text-center">
                {data.vehicle.vehicleNumber}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-600">Vehicle Type</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {data.vehicle.vehicleType}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Route</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {data.vehicle.routeName}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-gray-600">Extra Hour Rate (Client)</p>
              <p className="text-base sm:text-lg font-bold text-brand-red mt-1">
                {formatCurrency(data.vehicle.extraHourRate)}/hr
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5 text-brand-red" />
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
                {data?.driver.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600">Phone</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{data?.driver.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600">Joined</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {new Date(data?.driver.joinedDate || '').toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Preview */}
      {data?.salaryPreview && (
        <Card className="border-2 border-brand-red/20">
          <CardHeader className="bg-brand-red/5">
            <CardTitle className="text-lg flex items-center gap-2">
              💰 Salary Preview -{' '}
              {monthNames[data.salaryPreview.month - 1]}{' '}
              {data.salaryPreview.year}
            </CardTitle>
            <p className="text-xs text-gray-600 mt-1">
              Based on current tripsheet (
              {data.salaryPreview.status.charAt(0).toUpperCase() +
                data.salaryPreview.status.slice(1)}
              )
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Base Salary */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <p className="text-sm text-gray-600">
                  Base Salary ({data.salaryPreview.baseDays} days)
                </p>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(data.salaryPreview.baseSalary)}
              </p>
            </div>

            {/* Extra Days */}
            {data.salaryPreview.extraDays > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">
                    Working Days: {data.salaryPreview.totalWorkingDays}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Extra Days: {data.salaryPreview.extraDays} × ₹
                    {formatIndianNumber(data.salaryPreview.extraDayRate)}
                  </p>
                  <p className="font-semibold text-green-700">
                    +{formatCurrency(data.salaryPreview.extraDaysAmount)}
                  </p>
                </div>
                <div className="h-px bg-gray-200" />
              </div>
            )}

            {/* Extra Hours */}
            {data.salaryPreview.totalDriverExtraHours > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">
                    Hours above 12/day:{' '}
                    {data.salaryPreview.totalDriverExtraHours.toFixed(1)} hrs
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Extra Hours:{' '}
                    {data.salaryPreview.totalDriverExtraHours.toFixed(1)} × ₹
                    {data.salaryPreview.extraHourRate}
                  </p>
                  <p className="font-semibold text-green-700">
                    +{formatCurrency(data.salaryPreview.extraHoursAmount)}
                  </p>
                </div>
                <div className="h-px bg-gray-200" />
              </div>
            )}

            {/* Total */}
            <div className="pt-3 border-t-2 border-gray-300">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900">
                  Estimated Total
                </p>
                <p className="text-2xl font-bold text-brand-red">
                  {formatCurrency(data.salaryPreview.totalSalary)}
                </p>
              </div>
            </div>

            {data.salaryPreview.status !== 'approved' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Final amount will be calculated after admin approval
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/driver/profile/change-password">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/driver/help">
              <HelpCircle className="mr-2 h-4 w-4" />
              Contact Admin
            </Link>
          </Button>
          <Button
            variant="destructive"
            className="w-full justify-start"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <Skeleton className="h-10 w-full" />
      <Card>
        <CardContent className="pt-6 flex flex-col items-center space-y-3">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </CardContent>
      </Card>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
