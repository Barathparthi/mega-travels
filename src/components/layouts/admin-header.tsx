'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/shared/user-nav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileSidebar } from './mobile-sidebar';

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      {/* Left Side - Mobile Menu + Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <MobileSidebar />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb/Title */}
        {title && (
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
        )}
      </div>

      {/* Right Side - User Menu */}
      <div className="flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  );
}
