import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function FloatingDock({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    // Hidden until the pointer enters the hit-zone — no default-visible
    // state and no auto-hide timer to manage.
    const [visible, setVisible] = useState(false);

    return (
        // The hit-target is shrink-wrapped to the dock's own footprint
        // (plus a little padding for comfort) and centered independently
        // of viewport width, instead of spanning the full bottom edge of
        // the screen — hovering far from the dock no longer reveals it.
        // Mouse hover only — a focus handler here would also fire when the
        // window regains OS focus (e.g. alt-tabbing back) if a link inside
        // the dock still holds DOM focus from before, revealing the dock
        // without the pointer actually being anywhere near it.
        <div
            className="fixed bottom-0 left-1/2 z-40 flex h-16 w-fit -translate-x-1/2 items-end justify-center px-6"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            <nav
                aria-label="Primary"
                className={`mb-3 flex justify-center transition-all duration-200 ease-out ${
                    visible
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-3 opacity-0'
                }`}
            >
                <div className="flex items-center gap-0.5 rounded-xl bg-slate-900/95 p-1 shadow-[0_20px_50px_-12px_rgba(32,26,21,0.55)] backdrop-blur">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = isCurrentUrl(item.href);

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                prefetch
                                title={item.title}
                                className={`group relative flex size-10 items-center justify-center rounded-lg transition-all duration-150 hover:-translate-y-1 ${
                                    active
                                        ? 'bg-brand-red text-white'
                                        : 'text-brand-beige/70 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {Icon ? <Icon className="size-5" /> : null}

                                {item.hasBadge && (
                                    <span
                                        aria-label="Pending notification"
                                        className="absolute top-1 right-1 size-2 rounded-full bg-white ring-2 ring-brand-red"
                                    />
                                )}

                                {active && (
                                    <span className="absolute -bottom-1 size-1 rounded-full bg-brand-beige" />
                                )}

                                <span className="pointer-events-none absolute bottom-full mb-2 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-slate-900 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
