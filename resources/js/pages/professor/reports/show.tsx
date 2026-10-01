import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    FileVideo,
    ImageIcon,
    Trash2,
    UploadCloud,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import BackLink from '@/components/back-link';

interface Courseware {
    id: number;
    subject: string;
}

interface Screenshot {
    id: number;
    url: string;
}

interface Report {
    id: number;
    video_url: string | null;
    submitted_at: string;
    screenshots: Screenshot[];
}

interface Participant {
    student_name: string;
    first_joined_at: string;
    last_left_at: string | null;
    join_count: number;
    total_duration_seconds: number;
}

interface ReportShowProps {
    courseware: Courseware;
    class_date: string;
    day_label: string;
    report: Report | null;
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

export default function ReportShow({
    courseware,
    class_date: classDate,
    day_label: dayLabel,
    report,
    session_found: sessionFound,
    participants,
}: ReportShowProps) {
    const [video, setVideo] = useState<File | null>(null);
    const [screenshots, setScreenshots] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);

    const onVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
        setVideo(event.target.files?.[0] ?? null);
    };

    const onScreenshotsChange = (event: ChangeEvent<HTMLInputElement>) => {
        setScreenshots(Array.from(event.target.files ?? []));
    };

    const submit = () => {
        setProcessing(true);
        setProgress(0);

        router.post(
            `/professor/reports/${courseware.id}`,
            {
                class_date: classDate,
                video,
                screenshots,
            },
            {
                forceFormData: true,
                onProgress: (event) => setProgress(event?.percentage ?? null),
                onFinish: () => {
                    setProcessing(false);
                    setProgress(null);
                    setVideo(null);
                    setScreenshots([]);
                },
            },
        );
    };

    const removeScreenshot = (screenshotId: number) => {
        router.delete(`/professor/reports/screenshots/${screenshotId}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title={`Class Report — ${courseware.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <BackLink href="/professor/reports">
                        Back to class reports
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <FileVideo className="size-4" />
                            Class Report
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {courseware.subject}
                        </h1>
                        <p className="mt-2 text-sm text-red-100">{dayLabel}</p>
                        {report && (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-100">
                                <CheckCircle2 className="size-4" />
                                Submitted {formatDateTime(report.submitted_at)}
                            </p>
                        )}
                    </section>

                    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                <Users className="size-4 text-red-600" />
                                Attendance
                            </h2>

                            {!sessionFound ? (
                                <p className="mt-2 text-sm text-slate-500">
                                    No meeting session was recorded for this
                                    date — you can still submit a report, but
                                    attendance timestamps aren't available.
                                </p>
                            ) : participants.length > 0 ? (
                                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
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
                                                            {
                                                                participant.join_count
                                                            }
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
                                <p className="mt-2 text-sm text-slate-500">
                                    A meeting was recorded for this date, but no
                                    students joined.
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                <FileVideo className="size-4 text-red-600" />
                                Video recording
                            </h2>

                            {report?.video_url && (
                                <video
                                    src={report.video_url}
                                    controls
                                    className="mt-3 w-full rounded-lg bg-black"
                                />
                            )}

                            <input
                                type="file"
                                accept="video/*"
                                onChange={onVideoChange}
                                className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
                            />
                            {video && (
                                <p className="mt-1 text-xs text-slate-500">
                                    {video.name} selected — will replace the
                                    current video on submit.
                                </p>
                            )}
                        </div>

                        <div>
                            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                <ImageIcon className="size-4 text-red-600" />
                                Screenshots
                            </h2>

                            {report && report.screenshots.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {report.screenshots.map((screenshot) => (
                                        <div
                                            key={screenshot.id}
                                            className="group relative overflow-hidden rounded-lg border border-slate-200"
                                        >
                                            <img
                                                src={screenshot.url}
                                                alt="Class screenshot"
                                                className="h-28 w-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeScreenshot(
                                                        screenshot.id,
                                                    )
                                                }
                                                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                aria-label="Remove screenshot"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={onScreenshotsChange}
                                className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
                            />
                            {screenshots.length > 0 && (
                                <p className="mt-1 text-xs text-slate-500">
                                    {screenshots.length} screenshot
                                    {screenshots.length === 1 ? '' : 's'}{' '}
                                    selected to add.
                                </p>
                            )}
                        </div>

                        {progress !== null && (
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-red-600 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={submit}
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <UploadCloud className="size-4" />
                            {processing
                                ? 'Uploading…'
                                : report
                                  ? 'Update report'
                                  : 'Submit report'}
                        </button>
                    </section>
                </div>
            </div>
        </>
    );
}
