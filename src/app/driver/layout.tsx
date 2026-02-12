import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DriverHeader } from '@/components/layouts/driver-header';
import { DriverBottomNav } from '@/components/layouts/driver-bottom-nav';
import { InstallPrompt } from '@/components/driver/install-prompt';
import { PWAHandler } from '@/components/driver/pwa-handler';

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated or not a driver
  if (!session || session.user.role !== 'driver') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <PWAHandler />
      <DriverHeader />
      <main className="pb-20 px-3 sm:px-4 pt-3 sm:pt-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <DriverBottomNav />
      <InstallPrompt />
    </div>
  );
}
