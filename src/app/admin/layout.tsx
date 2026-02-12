import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminSidebar } from '@/components/layouts/admin-sidebar';
import { AdminHeader } from '@/components/layouts/admin-header';
import QueryProvider from '@/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated or not admin
  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  return (
    <QueryProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader />

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </QueryProvider>
  );
}
