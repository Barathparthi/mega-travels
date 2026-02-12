"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { ITripsheetFilters } from '@/backend/types';
import {
  fetchTripsheets,
  fetchTripsheet,
  approveTripsheet,
  rejectTripsheet,
} from '@/services/admin-tripsheets.service';

export function useAdminTripsheets(filters: ITripsheetFilters) {
  const hasVehicle = !!filters.vehicleId;

  return useQuery({
    queryKey: ['admin', 'tripsheets', filters],
    queryFn: () => fetchTripsheets(filters),
    enabled: hasVehicle, // Only fetch when a vehicle is selected
    staleTime: 30000, // 30 seconds
  });
}

export function useAdminTripsheet(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'tripsheets', id],
    queryFn: () => fetchTripsheet(id!),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
  });
}

export function useApproveTripsheet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => approveTripsheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tripsheets'] });
      toast({
        title: 'Success',
        description: 'Tripsheet approved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve tripsheet',
        variant: 'destructive',
      });
    },
  });
}

export function useRejectTripsheet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectTripsheet(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tripsheets'] });
      toast({
        title: 'Success',
        description: 'Tripsheet rejected and sent back to driver',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject tripsheet',
        variant: 'destructive',
      });
    },
  });
}
