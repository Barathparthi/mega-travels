import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  color: 'red' | 'purple' | 'cyan' | 'green';
}

const colorMap = {
  red: 'bg-brand-red',
  purple: 'bg-brand-purple',
  cyan: 'bg-brand-cyan',
  green: 'bg-green-500',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <Card className="transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          <div
            className={cn(
              'rounded-full p-3',
              colorMap[color],
              'bg-opacity-10'
            )}
          >
            <Icon className={cn('h-6 w-6', `text-${color}-600`)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
