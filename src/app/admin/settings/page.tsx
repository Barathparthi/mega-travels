'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, DollarSign, Users, Settings as SettingsIcon, Car, CheckSquare } from 'lucide-react';
import { CompanySettings } from '@/components/admin/settings/company-settings';
import { BillingRulesSettings } from '@/components/admin/settings/billing-rules-settings';
import { SalaryRulesSettings } from '@/components/admin/settings/salary-rules-settings';
import { SystemSettings } from '@/components/admin/settings/system-settings';
import { VehicleTypesSettings } from '@/components/admin/settings/vehicle-types-settings';
import { DeploymentChecklist } from '@/components/admin/settings/deployment-checklist';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage system configuration and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="vehicle-types" className="gap-2">
            <Car className="w-4 h-4" />
            <span className="hidden sm:inline">Vehicle Types</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="salary" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Salary</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="deployment" className="gap-2">
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Deployment</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="vehicle-types" className="space-y-4">
          <VehicleTypesSettings />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingRulesSettings />
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          <SalaryRulesSettings />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <DeploymentChecklist />
        </TabsContent>
      </Tabs>
    </div>
  );
}
