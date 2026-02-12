import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
    children: React.ReactNode;
    className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
    return (
        <div className={cn('w-full overflow-x-auto', className)}>
            <div className="min-w-[800px]">{children}</div>
        </div>
    );
}
