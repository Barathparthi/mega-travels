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
  LogOut,
  Lock,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
}

export default function AdminProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
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

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setData(userData);
      }
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your account information</p>
        </div>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-3 border-brand-red">
              <AvatarFallback className="bg-brand-red text-white text-2xl font-bold">
                {data?.name ? getInitials(data.name) : 'AD'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {data?.name || session?.user?.name}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Shield className="h-4 w-4 text-brand-red" />
                <p className="text-sm text-gray-600">Administrator</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-base text-gray-900 mt-1">
                {data?.name || session?.user?.name || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base text-gray-900 mt-1">
                {data?.email || session?.user?.email || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p className="text-base text-gray-900 mt-1">
                {data?.phone || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-base text-gray-900 mt-1">
                {data?.role === 'admin' ? 'Administrator' : data?.role || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <p className="text-base text-gray-900 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  data?.isActive !== false
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {data?.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/admin/profile/change-password">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
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
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
