'use client';

import { useState } from 'react';
import { LoanTable } from '@/components/admin/loans/loan-table';
import { AddLoanModal } from '@/components/admin/loans/add-loan-modal';
import { LoanRemindersCard } from '@/components/admin/loans/loan-reminders-card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function LoansPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Loans</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage vehicle loan EMI payments
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Loan Record
        </Button>
      </div>

      <Separator />

      {/* Loan Reminders (Overdue/Upcoming) */}
      <LoanRemindersCard />

      <Separator />

      {/* Loan History Table */}
      <LoanTable />

      {/* Add Loan Modal */}
      <AddLoanModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />
    </div>
  );
}

