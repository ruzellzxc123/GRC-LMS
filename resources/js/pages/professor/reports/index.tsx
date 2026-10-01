import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Clock, FileVideo } from 'lucide-react';
import BackLink from '@/components/back-link';

interface Occurrence {
    courseware_id: number;
    subject: string;
    date: string;
    day_label: string;
    is_today: boolean;
    is_past: boolean;
    report_id: number | null;
    submitted: boolean;
}

interface ReportsIndexProps {
    occurrences: Occurrence[];
}

export default function ReportsIndex({ occurrences }: ReportsIndexProps) {
    return (
        <>
            <Head title="Class Reports" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-4xl space-y-6">
                    <BackLink href="/professor/dashboard">
                        Back to dashboard
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <FileVideo className="size-4" />
                            Class Reports
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Your Classes
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            For each scheduled class, submit a video recording
                            and screenshots as proof of the session. Attendance
                            timestamps are pulled in automatically when the
                            class was held through a meeting.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {occurrences.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {occurrences.map((occurrence) => (
                                    <li
                                        key={`${occurrence.courseware_id}-${occurrence.date}`}
                                    >
                                        <Link
                                            href={`/professor/reports/${occurrence.courseware_id}/${occurrence.date}`}
                                            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-red-50/40"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {occurrence.subject}
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                                    <Clock className="size-3.5" />
                                                    {occurrence.day_label}
                                                    {occurrence.is_today &&
                                                        ' · Today'}
                                                </p>
                                            </div>

                                            {occurrence.submitted ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                    <CheckCircle2 className="size-3.5" />
                                                    Submitted
                                                </span>
                                            ) : occurrence.is_past ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                                    Needs report
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                    Upcoming
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <FileVideo className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No classes in this window
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Subjects need a weekly class day set before
                                    they show up here.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
