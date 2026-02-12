import { Card, CardContent } from '@/components/ui/card';
import { Fuel, DollarSign, TrendingUp, Gauge } from 'lucide-react';
import { IFuelSummaryStats } from '@/backend/types';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';

interface FuelSummaryCardsProps {
  stats: IFuelSummaryStats;
  isLoading?: boolean;
}

export function FuelSummaryCards({ stats, isLoading }: FuelSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Litres',
      value: `${formatIndianNumber(stats.totalLitres, { decimals: 1 })} L`,
      icon: Fuel,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Total Amount',
      value: `₹${formatIndianNumber(stats.totalAmount, { decimals: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      title: 'Avg Rate/Litre',
      value: `₹${stats.averageRatePerLitre.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Avg Mileage',
      value: `${stats.averageMileage.toFixed(2)} km/L`,
      icon: Gauge,
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
