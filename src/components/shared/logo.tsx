'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({
  collapsed = false,
  size = 'md',
  showText = true,
  className
}: LogoProps) {
  const sizeMap = {
    sm: { icon: 24, text: 'text-sm' },
    md: { icon: 32, text: 'text-base' },
    lg: { icon: 48, text: 'text-lg' },
  };

  const { icon: iconSize, text: textSize } = sizeMap[size];

  if (collapsed) {
    return (
      <div className={cn('flex items-center', className)}>
        <Image
          src="/logo.svg"
          alt="Mayaa Travels Logo"
          width={iconSize}
          height={iconSize}
          className="flex-shrink-0"
        />
      </div>
    );
  }

  if (!showText) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Image
          src="/logo.svg"
          alt="Mayaa Travels Logo"
          width={iconSize}
          height={iconSize}
          className="flex-shrink-0"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/logo.svg"
        alt="Mayaa Travels Logo"
        width={iconSize}
        height={iconSize}
        className="flex-shrink-0"
      />
      <div className="flex flex-col">
        <h1 className={cn('font-bold text-brand-red leading-tight', textSize)}>
          Mayaa Travels
        </h1>
        {size !== 'sm' && (
          <p className="text-xs text-gray-500">Fleet Management</p>
        )}
      </div>
    </div>
  );
}
