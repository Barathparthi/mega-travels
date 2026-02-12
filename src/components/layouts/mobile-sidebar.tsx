'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  HelpCircle,
  Calendar,
  Wrench,
  CreditCard,
  Wallet,
  HandCoins,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/admin/vehicles', icon: Car },
  { name: 'Drivers', href: '/admin/drivers', icon: Users },
  { name: 'Daily Entries', href: '/admin/daily-entries', icon: Calendar },
  { name: 'Trip Sheets', href: '/admin/tripsheets', icon: FileText },
  { name: 'Recent Submissions', href: '/admin/recent-submissions', icon: CheckCircle2 },
  { name: 'Services', href: '/admin/services', icon: Wrench },
  { name: 'Loans', href: '/admin/loans', icon: CreditCard },
  { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { name: 'Salary', href: '/admin/salary', icon: Wallet },
  { name: 'Advance Salary', href: '/admin/advance-salary', icon: HandCoins },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

const footerItems = [
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Help', href: '/admin/help', icon: HelpCircle },
];

export function MobileSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header with Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        <Logo size="md" showText />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                    active
                      ? 'bg-brand-red text-white'
                      : 'text-gray-700 hover:bg-red-50 hover:text-brand-red'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 py-4">
        <ul className="space-y-1 px-3">
          {footerItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-all hover:bg-gray-100"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
