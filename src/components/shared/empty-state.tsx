import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 max-w-md">{description}</p>
      {action && (
        <>
          {action.href ? (
            <Button asChild className="mt-6 bg-brand-red hover:bg-brand-red/90">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button
              onClick={action.onClick}
              className="mt-6 bg-brand-red hover:bg-brand-red/90"
            >
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
