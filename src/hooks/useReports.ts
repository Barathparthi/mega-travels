import { useQuery } from '@tanstack/react-query';
import * as reportsService from '@/services/reports.service';

/**
 * Hook to fetch monthly report
 */
export function useMonthlyReport(month: number, year: number, monthsBack: number = 6) {
  return useQuery({
    queryKey: ['monthly-report', month, year, monthsBack],
    queryFn: () => reportsService.getMonthlyReport(month, year, monthsBack),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch vehicle performance report
 */
export function useVehicleReport(vehicleId: string, monthsBack: number = 12) {
  return useQuery({
    queryKey: ['vehicle-report', vehicleId, monthsBack],
    queryFn: () => reportsService.getVehicleReport(vehicleId, monthsBack),
    enabled: !!vehicleId,
    staleTime: 60000,
  });
}

/**
 * Hook to fetch driver performance report
 */
export function useDriverReport(driverId: string, monthsBack: number = 12) {
  return useQuery({
    queryKey: ['driver-report', driverId, monthsBack],
    queryFn: () => reportsService.getDriverReport(driverId, monthsBack),
    enabled: !!driverId,
    staleTime: 60000,
  });
}

/**
 * Hook to fetch billing breakdown report
 */
export function useBillingReport(month: number, year: number) {
  return useQuery({
    queryKey: ['billing-report', month, year],
    queryFn: () => reportsService.getBillingReport(month, year),
    staleTime: 60000,
  });
}
