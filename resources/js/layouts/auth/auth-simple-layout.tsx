import { Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import type { AuthLayoutProps } from '@/types';

const DOT_GRID_STYLE = {
    backgroundImage:
        'radial-gradient(circle, rgba(255,255,255,0.35) 1.5px, transparent 1.5px)',
    backgroundSize: '18px 18px',
};

/**
 * Shared chrome for every auth/* page (login, register, forgot/reset/confirm
 * password) — brand panel + card treatment mirrors the public homepage's
 * hero (red gradient, same "Global Reciprocal College" wordmark and
 * "Student Learning Portal" pill) and the rounded-2xl/border-slate-200 card
 * convention used across every dashboard and content page in the app, so
 * this no longer looks like an unbranded starter-kit screen. The dot-grid,
 * blob, and oversized watermark on the brand panel are purely decorative —
 * lifted from a reference mockup the user provided — and don't touch the
 * real logo asset, which stays exactly as it was.
 */
export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh lg:grid-cols-[2fr_3fr]">
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-red-700 to-red-500 p-10 text-white lg:flex">
                <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
                <div
                    className="pointer-events-none absolute top-8 right-10 h-24 w-24 opacity-70"
                    style={DOT_GRID_STYLE}
                />
                <GraduationCap
                    strokeWidth={1}
                    className="pointer-events-none absolute -right-8 -bottom-10 size-72 text-white/10"
                />

                <Link
                    href="/"
                    className="relative z-10 flex items-center gap-3"
                >
                    <img
                        src="/images/grc-icon.png"
                        alt="Global Reciprocal College logo"
                        className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-1"
                    />
                    <div>
                        <p className="text-base font-bold leading-tight">
                            Global Reciprocal College
                        </p>
                        <p className="mt-0.5 text-xs font-semibold tracking-wide text-red-100 uppercase">
                            Learning Management System
                        </p>
                    </div>
                </Link>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                        <GraduationCap className="size-4" />
                        Student Learning Portal
                    </div>
                    <h2 className="mt-5 max-w-sm text-4xl leading-[1.15] font-bold">
                        Your Learning Journey Starts Here
                    </h2>
                    <p className="mt-4 max-w-sm text-base leading-relaxed text-red-50">
                        Access your courses, view your progress, and stay
                        connected with your academic community — all in one
                        place.
                    </p>
                </div>

                <p className="relative z-10 text-xs text-red-100">
                    © {new Date().getFullYear()} Global Reciprocal College
                </p>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-50 p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <Link
                        href="/"
                        className="mb-8 flex items-center justify-center gap-2.5 lg:hidden"
                    >
                        <img
                            src="/images/grc-icon.png"
                            alt="Global Reciprocal College logo"
                            className="h-9 w-9 object-contain"
                        />
                        <span className="text-sm font-bold text-slate-700">
                            Global Reciprocal College
                        </span>
                    </Link>

                    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/60">
                        <div className="mb-7 text-center">
                            <h1 className="text-2xl font-bold text-slate-900">
                                {title}
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                {description}
                            </p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
