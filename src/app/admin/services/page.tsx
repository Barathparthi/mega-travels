'use client';

import { useState } from 'react';
import { ServiceTable } from '@/components/admin/services/service-table';
import { AddServiceModal } from '@/components/admin/services/add-service-modal';
import { ServiceRemindersCard } from '@/components/admin/services/service-reminders-card';
import { Button } from '@/components/ui/button';
import { Plus, Wrench } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ServicesPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Services</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage vehicle service history and reminders
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Service Record
        </Button>
      </div>

      <Separator />

      {/* Service Reminders */}
      <ServiceRemindersCard />

      <Separator />

      {/* Service History Table */}
      <ServiceTable />

      {/* Add Service Modal */}
      <AddServiceModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />
    </div>
  );
}

