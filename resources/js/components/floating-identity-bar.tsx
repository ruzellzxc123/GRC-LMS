import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import type { Auth } from '@/types/auth';

interface FloatingIdentityBarProps {
    homeUrl: string;
    subtitle: string;
}

interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

const REVEAL_CLASSES =
    'transition-all duration-200 ease-out hover:-translate-y-0.5';
const HIDDEN_CLASSES = 'pointer-events-none -translate-y-2 opacity-0';
const SHOWN_CLASSES = 'translate-y-0 opacity-100';

export function FloatingIdentityBar({
    homeUrl,
    subtitle,
}: FloatingIdentityBarProps) {
    const { auth } = usePage<PageProps>().props;
    // Each pill is hidden until the pointer is right over its own corner —
    // no full-width hit-zone, and each is independent of the other.
    const [logoHovered, setLogoHovered] = useState(false);
    const [menuHovered, setMenuHovered] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuVisible = menuHovered || menuOpen;

    // Mouse hover only — a focus handler here would also fire when the
    // window regains OS focus (e.g. alt-tabbing back) if a link/button
    // inside a pill still holds DOM focus from before, revealing it
    // without the pointer actually being anywhere near it.
    return (
        <div className="fixed inset-x-0 top-5 z-30 flex items-start justify-between px-4 md:px-8">
            <div
                className="w-fit"
                onMouseEnter={() => setLogoHovered(true)}
                onMouseLeave={() => setLogoHovered(false)}
            >
                <Link
                    href={homeUrl}
                    className={`flex items-center gap-2.5 rounded-full bg-white/90 py-1.5 pr-4 pl-1.5 shadow-[0_1px_2px_rgba(32,26,21,0.06),0_16px_40px_-20px_rgba(32,26,21,0.35)] backdrop-blur ${REVEAL_CLASSES} ${logoHovered ? SHOWN_CLASSES : HIDDEN_CLASSES}`}
                >
                    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
                        <AppLogoIcon className="h-full w-full object-contain" />
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                        {subtitle}
                    </span>
                </Link>
            </div>

            {auth?.user && (
                <div
                    className="w-fit"
                    onMouseEnter={() => setMenuHovered(true)}
                    onMouseLeave={() => setMenuHovered(false)}
                >
                    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={`flex items-center gap-2 rounded-full bg-white/90 py-1.5 pr-2.5 pl-1.5 shadow-[0_1px_2px_rgba(32,26,21,0.06),0_16px_40px_-20px_rgba(32,26,21,0.35)] backdrop-blur ${REVEAL_CLASSES} ${menuVisible ? SHOWN_CLASSES : HIDDEN_CLASSES}`}
                            >
                                <UserInfo user={auth.user} />
                                <ChevronDown className="size-3.5 text-slate-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-56 rounded-2xl bg-white"
                            align="end"
                            sideOffset={8}
                        >
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
}
