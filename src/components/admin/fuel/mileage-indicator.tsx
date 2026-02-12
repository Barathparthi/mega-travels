import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MileageIndicatorProps {
  mileage: number;
  health: 'good' | 'average' | 'poor';
  trend?: 'up' | 'down' | 'stable';
  showTrend?: boolean;
}

export function MileageIndicator({
  mileage,
  health,
  trend,
  showTrend = false,
}: MileageIndicatorProps) {
  const healthColors = {
    good: 'text-green-600 bg-green-50',
    average: 'text-yellow-600 bg-yellow-50',
    poor: 'text-red-600 bg-red-50',
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    stable: <Minus className="h-4 w-4" />,
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600',
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'px-2 py-1 rounded text-sm font-medium',
          healthColors[health]
        )}
      >
        {mileage.toFixed(2)} km/L
      </span>

      {showTrend && trend && (
        <span className={cn('flex items-center', trendColors[trend])}>
          {trendIcons[trend]}
        </span>
      )}
    </div>
  );
}
