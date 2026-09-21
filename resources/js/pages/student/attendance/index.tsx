import { Head } from '@inertiajs/react';
import { CalendarCheck } from 'lucide-react';
import ScoreBar from '@/components/score-bar';

interface AttendanceRecord {
    date: string;
    status: string;
    remarks: string | null;
}

interface SubjectAttendance {
    courseware_id: number;
    subject: string;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    rate: number | null;
    records: AttendanceRecord[];
}

interface AttendanceIndexProps {
    subjects: SubjectAttendance[];
}

const STATUS_LABELS: Record<string, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
};

const STATUS_STYLES: Record<string, string> = {
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    excused: 'bg-slate-100 text-slate-700',
};

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

export default function AttendanceIndex({ subjects }: AttendanceIndexProps) {
    return (
        <>
            <Head title="Attendance" />

            <div className="min-h-full bg-red-50/30 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1200px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <CalendarCheck className="size-4" />
                            Attendance
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            My Attendance
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            Your attendance record per subject, sorted
                            alphabetically.
                        </p>
                    </section>

                    {subjects.length > 0 ? (
                        <div className="space-y-6">
                            {subjects.map((subject) => (
                                <section
                                    key={subject.courseware_id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                                        <div>
                                            <h2 className="font-semibold text-slate-900">
                                                {subject.subject}
                                            </h2>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {subject.present} present ·{' '}
                                                {subject.absent} absent ·{' '}
                                                {subject.late} late ·{' '}
                                                {subject.excused} excused
                                                {' · '}
                                                {subject.total} total
                                            </p>
                                        </div>
                                        <ScoreBar value={subject.rate} />
                                    </div>

                                    {subject.records.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[500px] text-left">
                                                <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Date
                                                        </th>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Status
                                                        </th>
                                                        <th className="px-5 py-3 font-semibold">
                                                            Remarks
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {subject.records.map(
                                                        (record, index) => (
                                                            <tr key={index}>
                                                                <td className="px-5 py-3 text-sm text-slate-600">
                                                                    {formatDate(
                                                                        record.date,
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                            STATUS_STYLES[
                                                                                record
                                                                                    .status
                                                                            ] ??
                                                                            'bg-slate-100 text-slate-700'
                                                                        }`}
                                                                    >
                                                                        {STATUS_LABELS[
                                                                            record
                                                                                .status
                                                                        ] ??
                                                                            record.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-3 text-sm text-slate-600">
                                                                    {record.remarks ??
                                                                        '—'}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="px-5 py-6 text-center text-sm text-slate-500">
                                            No attendance records yet.
                                        </p>
                                    )}
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                            <CalendarCheck className="mx-auto size-10 text-slate-300" />
                            <h3 className="mt-3 font-semibold text-slate-700">
                                No subjects yet
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Enroll in a subject to see attendance here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
