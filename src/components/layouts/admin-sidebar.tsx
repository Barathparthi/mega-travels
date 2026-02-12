'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  DollarSign,
  Wallet,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wrench,
  CreditCard,
  HandCoins,
  CheckCircle2,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <Logo collapsed={collapsed} size="md" showText={!collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="flex-shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <TooltipProvider delayDuration={0}>
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                    active
                      ? 'bg-brand-red text-white'
                      : 'text-gray-700 hover:bg-red-50 hover:text-brand-red',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </Link>
              );

              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 py-4">
        <TooltipProvider delayDuration={0}>
          <ul className="space-y-1 px-3">
            {footerItems.map((item) => {
              const Icon = item.icon;

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 transition-all hover:bg-gray-100',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </Link>
              );

              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      </div>
    </aside>
  );
}
