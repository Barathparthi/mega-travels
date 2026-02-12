'use client';

import { useState } from 'react';
import { AdvanceSalaryTable } from '@/components/admin/advance-salary/advance-salary-table';
import { AddAdvanceSalaryModal } from '@/components/admin/advance-salary/add-advance-salary-modal';
import { Button } from '@/components/ui/button';
import { Plus, Wallet } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AdvanceSalaryPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advance Salary</h1>
          <p className="text-muted-foreground mt-2">
            Manage driver advance salary requests and track deductions
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Advance Request
        </Button>
      </div>

      <Separator />

      {/* Advance Salary Table */}
      <AdvanceSalaryTable />

      {/* Add Advance Modal */}
      <AddAdvanceSalaryModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />
    </div>
  );
}

