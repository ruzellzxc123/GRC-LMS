import { Head } from '@inertiajs/react';
import { FileVideo, ImageIcon, Users } from 'lucide-react';
import BackLink from '@/components/back-link';

interface Screenshot {
    id: number;
    url: string;
}

interface ReportDetail {
    id: number;
    class_date: string;
    day_label: string;
    submitted_at: string;
    subject: string;
    professor_id: number;
    professor_name: string;
    video_url: string | null;
    screenshots: Screenshot[];
}

interface Participant {
    student_name: string;
    first_joined_at: string;
    last_left_at: string | null;
    join_count: number;
    total_duration_seconds: number;
}

interface AdminClassReportShowProps {
    report: ReportDetail;
    session_found: boolean;
    participants: Participant[];
}

function formatDateTime(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
        return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
}

export default function AdminClassReportShow({
    report,
    session_found: sessionFound,
    participants,
}: AdminClassReportShowProps) {
    return (
        <>
            <Head title={`Class Report — ${report.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <BackLink
                        href={`/admin/class-reports/professors/${report.professor_id}`}
                    >
                        Back to reports
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <FileVideo className="size-4" />
                            Class Report
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {report.subject}
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            {report.day_label} · Submitted by{' '}
                            {report.professor_name} on{' '}
                            {formatDateTime(report.submitted_at)}
                        </p>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                            <Users className="size-4 text-red-600" />
                            Attendance
                        </h2>

                        {!sessionFound ? (
                            <p className="text-sm text-slate-500">
                                No meeting session was recorded for this date.
                            </p>
                        ) : participants.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full min-w-[600px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-3 py-2 font-semibold">
                                                Student
                                            </th>
                                            <th className="px-3 py-2 font-semibold">
                                                Joined
                                            </th>
                                            <th className="px-3 py-2 font-semibold">
                                                Left
                                            </th>
                                            <th className="px-3 py-2 font-semibold">
                                                Times joined
                                            </th>
                                            <th className="px-3 py-2 font-semibold">
                                                Total time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {participants.map(
                                            (participant, index) => (
                                                <tr key={index}>
                                                    <td className="px-3 py-2 font-medium text-slate-900">
                                                        {
                                                            participant.student_name
                                                        }
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-600">
                                                        {formatDateTime(
                                                            participant.first_joined_at,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-600">
                                                        {participant.last_left_at
                                                            ? formatDateTime(
                                                                  participant.last_left_at,
                                                              )
                                                            : 'Still in meeting'}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-600">
                                                        {participant.join_count}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-600">
                                                        {formatDuration(
                                                            participant.total_duration_seconds,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">
                                A meeting was recorded for this date, but no
                                students joined.
                            </p>
                        )}
                    </section>

                    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                <FileVideo className="size-4 text-red-600" />
                                Video recording
                            </h2>

                            {report.video_url ? (
                                <video
                                    src={report.video_url}
                                    controls
                                    className="mt-3 w-full rounded-lg bg-black"
                                />
                            ) : (
                                <p className="mt-2 text-sm text-slate-500">
                                    No video was submitted.
                                </p>
                            )}
                        </div>

                        <div>
                            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                <ImageIcon className="size-4 text-red-600" />
                                Screenshots
                            </h2>

                            {report.screenshots.length > 0 ? (
                                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {report.screenshots.map((screenshot) => (
                                        <a
                                            key={screenshot.id}
                                            href={screenshot.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="overflow-hidden rounded-lg border border-slate-200"
                                        >
                                            <img
                                                src={screenshot.url}
                                                alt="Class screenshot"
                                                className="h-28 w-full object-cover"
                                            />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-slate-500">
                                    No screenshots were submitted.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
