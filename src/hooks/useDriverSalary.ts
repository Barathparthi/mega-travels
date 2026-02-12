import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import driverSalaryService, {
  DriverSalary,
  SalaryFilters,
  GenerateSalaryData,
  GenerateAllSalariesData,
  MarkPaidData,
  UpdateSalaryData,
  SalaryResponse,
} from '@/services/driver-salary.service';

// Query keys
export const salaryKeys = {
  all: ['driver-salary'] as const,
  salaries: (filters?: SalaryFilters) =>
    [...salaryKeys.all, 'salaries', filters] as const,
  salary: (id: string) => [...salaryKeys.all, 'salary', id] as const,
};

// Get all salaries with optional filters
export function useDriverSalaries(filters?: SalaryFilters) {
  return useQuery<SalaryResponse, Error>({
    queryKey: salaryKeys.salaries(filters),
    queryFn: () => driverSalaryService.getAllSalaries(filters),
  });
}

// Get single salary by ID
export function useDriverSalary(id: string) {
  return useQuery<DriverSalary, Error>({
    queryKey: salaryKeys.salary(id),
    queryFn: () => driverSalaryService.getSalaryById(id),
    enabled: !!id,
  });
}

// Generate salary for single tripsheet
export function useGenerateSalary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<DriverSalary, Error, GenerateSalaryData>({
    mutationFn: (data) => driverSalaryService.generateSalary(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.salaries() });
      toast({
        title: 'Success',
        description: 'Salary generated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate salary',
        variant: 'destructive',
      });
    },
  });
}

// Generate salaries for all approved tripsheets
export function useGenerateAllSalaries() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<any, Error, GenerateAllSalariesData>({
    mutationFn: (data) => driverSalaryService.generateAllSalaries(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.salaries() });
      toast({
        title: 'Success',
        description: `Generated ${result.stats.newlyGenerated} salaries successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate salaries',
        variant: 'destructive',
      });
    },
  });
}

// Update salary notes
export function useUpdateSalary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<DriverSalary, Error, { id: string; data: UpdateSalaryData }>(
    {
      mutationFn: ({ id, data }) => driverSalaryService.updateSalary(id, data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: salaryKeys.salary(data._id) });
        queryClient.invalidateQueries({ queryKey: salaryKeys.salaries() });
        toast({
          title: 'Success',
          description: 'Salary updated successfully',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update salary',
          variant: 'destructive',
        });
      },
    }
  );
}

// Mark salary as paid
export function useMarkSalaryPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<DriverSalary, Error, { id: string; data: MarkPaidData }>({
    mutationFn: ({ id, data }) => driverSalaryService.markAsPaid(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.salary(data._id) });
      queryClient.invalidateQueries({ queryKey: salaryKeys.salaries() });
      toast({
        title: 'Success',
        description: 'Salary marked as paid successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark salary as paid',
        variant: 'destructive',
      });
    },
  });
}

// Delete salary
export function useDeleteSalary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: (id) => driverSalaryService.deleteSalary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.salaries() });
      toast({
        title: 'Success',
        description: 'Salary deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete salary',
        variant: 'destructive',
      });
    },
  });
}

// Export salaries to Excel
export function useExportSalaries() {
  const { toast } = useToast();

  return useMutation<
    Blob,
    Error,
    { month?: number; year?: number; status?: string }
  >({
    mutationFn: (filters) => driverSalaryService.exportToExcel(filters),
    onSuccess: (blob, variables) => {
      const monthName = variables.month
        ? driverSalaryService.constructor.name === 'DriverSalaryService'
          ? (driverSalaryService.constructor as any).getMonthName(variables.month)
          : 'Unknown'
        : 'All';
      const year = variables.year || new Date().getFullYear();
      const filename = `driver-salaries-${monthName}-${year}.xlsx`;

      driverSalaryService.downloadExcel(blob, filename);

      toast({
        title: 'Success',
        description: 'Salaries exported successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export salaries',
        variant: 'destructive',
      });
    },
  });
}
