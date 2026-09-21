import { Head, Link } from '@inertiajs/react';
import { ClipboardList, Clock3, Users } from 'lucide-react';

interface ActivityItem {
    type: string;
    title: string;
    occurred_at: string;
}

interface ActivitiesIndexProps {
    activities: ActivityItem[];
}

const TYPE_LABELS: Record<string, string> = {
    enrollment: 'Enrollment',
    feedback: 'Feedback',
    quiz_attempt: 'Quiz Attempt',
};

function formatDateTime(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

export default function ActivitiesIndex({ activities }: ActivitiesIndexProps) {
    return (
        <>
            <Head title="Activities" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1400px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <ClipboardList className="size-4" />
                                    Activity Management
                                </div>
                                <h1 className="mt-2 text-2xl font-bold">
                                    Activities
                                </h1>
                                <p className="mt-2 text-sm text-red-100">
                                    Review upcoming tasks and activity
                                    assignments across the LMS.
                                </p>
                            </div>

                            <Link
                                href="/admin/courses"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                <Users className="size-4" />
                                Manage Subjects
                            </Link>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Current Activities
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Track activity status, assignees, and
                                    deadlines.
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                <Clock3 className="size-4" /> Updated now
                            </span>
                        </div>

                        {activities.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] text-left">
                                    <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-5 py-3">
                                                Activity
                                            </th>
                                            <th className="px-5 py-3">Type</th>
                                            <th className="px-5 py-3">
                                                Occurred At
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activities.map((activity, index) => (
                                            <tr
                                                key={index}
                                                className="hover:bg-red-50/40"
                                            >
                                                <td className="px-5 py-4 font-medium text-slate-900">
                                                    {activity.title}
                                                </td>
                                                <td className="px-5 py-4 text-sm">
                                                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                        {TYPE_LABELS[
                                                            activity.type
                                                        ] ?? activity.type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-slate-600">
                                                    {formatDateTime(
                                                        activity.occurred_at,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center px-6 py-14 text-center">
                                <ClipboardList className="size-12 text-slate-300" />
                                <h3 className="mt-4 text-xl font-semibold text-slate-800">
                                    No activities available
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">
                                    Activity assignments will show here when
                                    they're created.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
