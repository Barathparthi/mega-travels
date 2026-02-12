import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

export default function HelpPage() {
  return (
    <div>
      <PageHeader
        title="Help"
        subtitle="Get help and support"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <HelpCircle className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Help & Support
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            Help and support resources will be available here. You'll find documentation, FAQs, and contact information for support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
