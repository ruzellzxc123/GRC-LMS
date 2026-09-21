import { Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppearanceTabs({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'inline-flex items-center rounded-lg bg-slate-100 p-1',
                className,
            )}
            {...props}
        >
            <div className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm">
                <Sun className="h-4 w-4 text-red-600" />
                Light
            </div>
        </div>
    );
}
