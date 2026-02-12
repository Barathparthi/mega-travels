import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IFuelFilters } from '@/backend/types';
import * as fuelService from '@/services/fuel.service';

/**
 * Hook to fetch fuel summary
 */
export function useFuelSummary(filters: IFuelFilters) {
  return useQuery({
    queryKey: ['fuel-summary', filters],
    queryFn: () => fuelService.getFuelSummary(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch vehicle fuel detail
 */
export function useVehicleFuelDetail(
  vehicleId: string,
  startDate?: Date,
  endDate?: Date
) {
  return useQuery({
    queryKey: ['vehicle-fuel-detail', vehicleId, startDate, endDate],
    queryFn: () => fuelService.getVehicleFuelDetail(vehicleId, startDate, endDate),
    enabled: !!vehicleId,
    staleTime: 30000,
  });
}

/**
 * Hook to export fuel report
 */
export function useExportFuelReport() {
  return useMutation({
    mutationFn: (filters: IFuelFilters) => fuelService.exportFuelReport(filters),
  });
}
