import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileQuestion className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-3">
                    Page Not Found
                </h2>
                <p className="text-gray-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" asChild>
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/dashboard">
                            <Home className="w-4 h-4 mr-2" />
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
