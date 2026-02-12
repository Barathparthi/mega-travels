import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import billingService, {
  Bill,
  PendingTripSheet,
  GenerateBillData,
  UpdateBillData,
  BillingFilters,
  BillingResponse,
} from '@/services/billing.service';

// Query keys
export const billingKeys = {
  all: ['billing'] as const,
  pending: () => [...billingKeys.all, 'pending'] as const,
  bills: (filters?: BillingFilters) =>
    [...billingKeys.all, 'bills', filters] as const,
  bill: (id: string) => [...billingKeys.all, 'bill', id] as const,
};

// Get pending billing (tripsheets without bills)
export function usePendingBilling() {
  return useQuery<PendingTripSheet[], Error>({
    queryKey: billingKeys.pending(),
    queryFn: () => billingService.getPendingBilling(),
  });
}

// Get all bills with optional filters
export function useBills(filters?: BillingFilters) {
  return useQuery<BillingResponse, Error>({
    queryKey: billingKeys.bills(filters),
    queryFn: () => billingService.getAllBills(filters),
  });
}

// Get single bill by ID
export function useBill(id: string) {
  return useQuery<Bill, Error>({
    queryKey: billingKeys.bill(id),
    queryFn: () => billingService.getBillById(id),
    enabled: !!id,
  });
}

// Generate new bill
export function useGenerateBill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Bill, Error, GenerateBillData>({
    mutationFn: (data) => billingService.generateBill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.pending() });
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() });
      toast({
        title: 'Success',
        description: 'Bill generated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to generate bill',
        variant: 'destructive',
      });
    },
  });
}

// Update bill
export function useUpdateBill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Bill, Error, { id: string; data: UpdateBillData }>({
    mutationFn: ({ id, data }) => billingService.updateBill(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(data._id) });
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() });
      toast({
        title: 'Success',
        description: 'Bill updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update bill',
        variant: 'destructive',
      });
    },
  });
}

// Update bill status
export function useUpdateBillStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<Bill, Error, { id: string; status: 'sent' | 'paid' }>({
    mutationFn: ({ id, status }) => billingService.updateBillStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.bill(data._id) });
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() });
      toast({
        title: 'Success',
        description: 'Bill status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update bill status',
        variant: 'destructive',
      });
    },
  });
}

// Delete bill
export function useDeleteBill() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: (id) => billingService.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.pending() });
      queryClient.invalidateQueries({ queryKey: billingKeys.bills() });
      toast({
        title: 'Success',
        description: 'Bill deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete bill',
        variant: 'destructive',
      });
    },
  });
}
