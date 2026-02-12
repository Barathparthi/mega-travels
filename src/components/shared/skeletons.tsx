import { Skeleton } from '@/components/ui/skeleton';

// Table skeleton
export function TableSkeleton({
    rows = 5,
    columns = 5,
}: {
    rows?: number;
    columns?: number;
}) {
    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="p-4 border-b last:border-0">
                    <div className="flex gap-4">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton key={colIndex} className="h-4 flex-1" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Card skeleton
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-lg border p-6">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/4" />
        </div>
    );
}

// Stats cards skeleton
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

// Form skeleton
export function FormSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
    );
}

// Detail page skeleton
export function DetailPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Cards */}
            <StatsCardsSkeleton count={4} />

            {/* Table */}
            <TableSkeleton rows={5} columns={6} />
        </div>
    );
}

// List item skeleton
export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20" />
        </div>
    );
}
