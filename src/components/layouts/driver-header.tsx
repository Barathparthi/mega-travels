'use client';

import { useSession, signOut } from 'next-auth/react';
import { Logo } from '@/components/shared/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';

export function DriverHeader() {
  const { data: session } = useSession();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="flex h-14 items-center justify-between px-3 sm:px-4 max-w-2xl mx-auto">
        {/* Logo */}
        <Logo size="sm" showText={false} />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 focus:outline-none active:opacity-70">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-brand-red">
                <AvatarFallback className="bg-brand-red text-white text-xs sm:text-sm font-medium">
                  {session?.user?.name ? getInitials(session.user.name) : 'DR'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-bold">{session?.user?.name}</span>
                <span className="text-xs text-gray-500 mt-0.5">
                  {session?.user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/driver/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
