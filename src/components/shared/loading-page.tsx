import { LoadingSpinner } from './loading-spinner';

export function LoadingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LoadingSpinner size="lg" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
                <p className="text-gray-600">Please wait while we load your data</p>
            </div>
        </div>
    );
}
