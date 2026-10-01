import { Head, Link } from '@inertiajs/react';
import { Eye, Video } from 'lucide-react';
import BackLink from '@/components/back-link';

interface LiveClass {
    id: number;
    subject: string;
    professor_name: string;
    department: string | null;
    started_at: string;
}

interface LiveClassesIndexProps {
    classes: LiveClass[];
}

function formatStartedAt(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

export default function LiveClassesIndex({ classes }: LiveClassesIndexProps) {
    return (
        <>
            <Head title="Live Classes" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-4xl space-y-6">
                    <BackLink href="/admin/dashboard">
                        Back to dashboard
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Video className="size-4" />
                            Live Classes
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Classes In Progress
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            Join any class currently in session to observe —
                            you'll appear in the meeting clearly labeled as an
                            admin observer, never as a moderator.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {classes.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {classes.map((liveClass) => (
                                    <li key={liveClass.id}>
                                        <Link
                                            href={`/admin/live-classes/${liveClass.id}`}
                                            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-red-50/40"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="relative flex size-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                                </span>
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {liveClass.subject}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {
                                                            liveClass.professor_name
                                                        }
                                                        {liveClass.department
                                                            ? ` · ${liveClass.department}`
                                                            : ''}
                                                        {' · Started '}
                                                        {formatStartedAt(
                                                            liveClass.started_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                                <Eye className="size-4" />
                                                Observe
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <Video className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No classes are live right now
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    This list updates whenever a professor
                                    starts a class meeting.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
