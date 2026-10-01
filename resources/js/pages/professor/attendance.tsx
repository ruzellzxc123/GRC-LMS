import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarCheck,
    CalendarClock,
    CheckCircle2,
    Lock,
    Save,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import BackLink from '@/components/back-link';

interface Courseware {
    id: number;
    subject: string;
}

interface RosterEntry {
    enrollment_id: number;
    student: {
        id: number;
        name: string;
        email: string;
        student_id: string | null;
    };
    status: string | null;
}

interface ClassDate {
    value: string;
    label: string;
    is_today: boolean;
    is_future: boolean;
    has_records: boolean;
}

interface AttendanceProps {
    courseware: Courseware;
    date: string;
    roster: RosterEntry[];
    class_day: string | null;
    class_start_time: string | null;
    class_end_time: string | null;
    dates: ClassDate[];
    can_mark: boolean;
}

interface PageProps {
    errors: Record<string, string>;
    [key: string]: unknown;
}

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused'] as const;

export default function Attendance({
    courseware,
    date,
    roster,
    class_day,
    class_start_time,
    class_end_time,
    dates,
    can_mark,
}: AttendanceProps) {
    const { errors } = usePage<PageProps>().props;
    const [statuses, setStatuses] = useState<Record<number, string>>(
        Object.fromEntries(
            roster.map((entry) => [
                entry.enrollment_id,
                entry.status ?? 'present',
            ]),
        ),
    );

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!can_mark) {
            return;
        }

        router.post(`/professor/courses/${courseware.id}/attendance`, {
            date,
            records: Object.entries(statuses).map(
                ([enrollmentId, status]) => ({
                    enrollment_id: Number(enrollmentId),
                    status,
                }),
            ),
        });
    };

    return (
        <>
            <Head title={`Attendance — ${courseware.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <BackLink
                        href={`/professor/courses/${courseware.id}/roster`}
                    >
                        Back to roster
                    </BackLink>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <CalendarCheck className="size-7" />
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {courseware.subject}
                                    </h1>
                                    {class_day && class_start_time && class_end_time ? (
                                        <p className="mt-1 flex items-center gap-1.5 text-sm text-red-100">
                                            <CalendarClock className="size-4" />
                                            Every {class_day},{' '}
                                            {class_start_time} –{' '}
                                            {class_end_time}
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-sm text-red-100">
                                            No class schedule set for this
                                            subject.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                        <section className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-4 py-3">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Class Sessions
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Future sessions unlock automatically.
                                </p>
                            </div>
                            <div className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
                                {dates.length === 0 && (
                                    <p className="p-4 text-sm text-slate-500">
                                        No scheduled sessions — set a class
                                        day and academic term first.
                                    </p>
                                )}
                                {dates.map((entry) => {
                                    const isSelected =
                                        entry.value === date;

                                    if (entry.is_future) {
                                        return (
                                            <div
                                                key={entry.value}
                                                title="This session hasn't happened yet"
                                                className="flex cursor-not-allowed items-center justify-between gap-2 px-4 py-2.5 text-sm text-slate-300"
                                            >
                                                <span>{entry.label}</span>
                                                <Lock className="size-3.5 shrink-0" />
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={entry.value}
                                            href={`/professor/courses/${courseware.id}/attendance`}
                                            data={{ date: entry.value }}
                                            preserveState={false}
                                            className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm ${
                                                isSelected
                                                    ? 'bg-red-50 font-semibold text-red-700'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                {entry.label}
                                                {entry.is_today && (
                                                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-red-700">
                                                        Today
                                                    </span>
                                                )}
                                            </span>
                                            {entry.has_records && (
                                                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-6 py-4">
                                <h2 className="font-semibold text-slate-900">
                                    {
                                        dates.find((d) => d.value === date)
                                            ?.label ?? date
                                    }
                                </h2>
                            </div>

                            <form onSubmit={submit} className="p-6">
                                {!can_mark && (
                                    <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                        <p>
                                            {errors.date ??
                                                (class_start_time &&
                                                class_end_time
                                                    ? `Attendance can only be taken between ${class_start_time} and ${class_end_time} on ${class_day}.`
                                                    : 'This session is view-only — attendance can only be taken live, during class hours.')}
                                        </p>
                                    </div>
                                )}

                                {errors.date && can_mark && (
                                    <p className="mb-6 text-sm font-semibold text-red-600">
                                        {errors.date}
                                    </p>
                                )}

                                <fieldset
                                    disabled={!can_mark}
                                    className="divide-y divide-slate-100 border-t border-slate-200 disabled:opacity-50"
                                >
                                    {roster.map((entry) => (
                                        <div
                                            key={entry.enrollment_id}
                                            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {entry.student.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {entry.student
                                                        .student_id ??
                                                        entry.student.email}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                {STATUS_OPTIONS.map(
                                                    (status) => (
                                                        <label
                                                            key={status}
                                                            className="flex items-center gap-1.5 text-sm text-slate-700 capitalize"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`status-${entry.enrollment_id}`}
                                                                value={status}
                                                                checked={
                                                                    statuses[
                                                                        entry
                                                                            .enrollment_id
                                                                    ] ===
                                                                    status
                                                                }
                                                                onChange={() =>
                                                                    setStatuses(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [entry.enrollment_id]:
                                                                                status,
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                            {status}
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {roster.length === 0 && (
                                        <p className="py-6 text-center text-sm text-slate-500">
                                            No students enrolled in this
                                            subject yet.
                                        </p>
                                    )}
                                </fieldset>

                                {roster.length > 0 && (
                                    <div className="flex justify-end border-t border-slate-200 pt-5">
                                        <button
                                            type="submit"
                                            disabled={!can_mark}
                                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <Save className="size-4" />
                                            Save Attendance
                                        </button>
                                    </div>
                                )}
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
