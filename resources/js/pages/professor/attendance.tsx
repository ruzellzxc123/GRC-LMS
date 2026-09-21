import { Head, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CalendarCheck, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import BackLink from '@/components/back-link';

interface Courseware {
    id: number;
    subject: string;
    course_code: string | null;
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

interface AttendanceProps {
    courseware: Courseware;
    date: string;
    roster: RosterEntry[];
    class_day: string | null;
    is_scheduled_day: boolean;
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
    is_scheduled_day,
}: AttendanceProps) {
    const { errors } = usePage<PageProps>().props;
    const [selectedDate, setSelectedDate] = useState(date);
    const [statuses, setStatuses] = useState<Record<number, string>>(
        Object.fromEntries(
            roster.map((entry) => [
                entry.enrollment_id,
                entry.status ?? 'present',
            ]),
        ),
    );

    const changeDate = (event: FormEvent<HTMLInputElement>) => {
        const value = event.currentTarget.value;
        setSelectedDate(value);
        router.get(
            `/professor/courses/${courseware.id}/attendance`,
            { date: value },
            { preserveState: false },
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.post(`/professor/courses/${courseware.id}/attendance`, {
            date: selectedDate,
            records: Object.entries(statuses).map(([enrollmentId, status]) => ({
                enrollment_id: Number(enrollmentId),
                status,
            })),
        });
    };

    return (
        <>
            <Head title={`Attendance — ${courseware.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <BackLink
                        href={`/professor/courses/${courseware.id}/roster`}
                    >
                        Back to roster
                    </BackLink>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-gradient-to-r from-red-700 to-red-500 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <CalendarCheck className="size-7" />
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {courseware.subject}
                                    </h1>
                                    <p className="mt-1 text-sm text-red-100">
                                        Mark attendance for a specific date.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-6">
                            <div className="mb-6 grid gap-2 sm:w-64">
                                <label
                                    htmlFor="date"
                                    className="text-sm font-medium text-slate-700"
                                >
                                    Date
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={changeDate}
                                    className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                />
                            </div>

                            {!is_scheduled_day && (
                                <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                    <p>
                                        {class_day
                                            ? `This subject only meets on ${class_day}. Attendance can't be recorded on any other day.`
                                            : "This subject doesn't meet on this date."}
                                    </p>
                                </div>
                            )}

                            {errors.date && (
                                <p className="mb-6 text-sm font-semibold text-red-600">
                                    {errors.date}
                                </p>
                            )}

                            <fieldset
                                disabled={!is_scheduled_day}
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
                                                {entry.student.student_id ??
                                                    entry.student.email}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {STATUS_OPTIONS.map((status) => (
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
                                                            ] === status
                                                        }
                                                        onChange={() =>
                                                            setStatuses(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [entry.enrollment_id]:
                                                                        status,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                    {status}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {roster.length === 0 && (
                                    <p className="py-6 text-center text-sm text-slate-500">
                                        No students enrolled in this subject
                                        yet.
                                    </p>
                                )}
                            </fieldset>

                            {roster.length > 0 && (
                                <div className="flex justify-end border-t border-slate-200 pt-5">
                                    <button
                                        type="submit"
                                        disabled={!is_scheduled_day}
                                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Save className="size-4" />
                                        Save Attendance
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
