'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DriverBottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname.startsWith(path);

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 safe-area-bottom">
            <div className="max-w-2xl mx-auto h-full flex items-center justify-around px-2">
                <Link
                    href="/driver/dashboard"
                    className={cn(
                        'flex flex-col items-center justify-center w-full h-full space-y-0.5 active:scale-95 transition-transform min-h-[44px]',
                        isActive('/driver/dashboard')
                            ? 'text-brand-red'
                            : 'text-gray-500 active:text-gray-700'
                    )}
                >
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-[10px] sm:text-xs font-medium">Home</span>
                </Link>

                <Link
                    href="/driver/tripsheet"
                    className={cn(
                        'flex flex-col items-center justify-center w-full h-full space-y-0.5 active:scale-95 transition-transform min-h-[44px]',
                        isActive('/driver/tripsheet') && !isActive('/driver/tripsheet/entry')
                            ? 'text-brand-red'
                            : 'text-gray-500 active:text-gray-700'
                    )}
                >
                    <FileText className="h-6 w-6" />
                    <span className="text-[10px] sm:text-xs font-medium">Tripsheet</span>
                </Link>

                <Link
                    href="/driver/profile"
                    className={cn(
                        'flex flex-col items-center justify-center w-full h-full space-y-0.5 active:scale-95 transition-transform min-h-[44px]',
                        isActive('/driver/profile')
                            ? 'text-brand-red'
                            : 'text-gray-500 active:text-gray-700'
                    )}
                >
                    <User className="h-6 w-6" />
                    <span className="text-[10px] sm:text-xs font-medium">Profile</span>
                </Link>
            </div>
        </div>
    );
}
