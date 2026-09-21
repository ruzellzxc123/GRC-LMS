import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { goBack } from '@/lib/back-navigation';

interface BackLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    iconClassName?: string;
}

const DEFAULT_CLASSNAME =
    'inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-700';

/**
 * Renders like the "Back to ..." links used throughout the app, but instead
 * of always going to a fixed destination, it returns to whatever page the
 * user actually came from — falling back to `href` only when there's no
 * real previous page in this session.
 */
export default function BackLink({
    href,
    children,
    className,
    iconClassName = 'size-4',
}: BackLinkProps) {
    return (
        <button
            type="button"
            onClick={() => goBack(href)}
            className={className ?? DEFAULT_CLASSNAME}
        >
            <ArrowLeft className={iconClassName} />
            {children}
        </button>
    );
}
