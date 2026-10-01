import { Head, useForm } from '@inertiajs/react';
import {
    Clock,
    Disc,
    FileVideo,
    MessageSquare,
    Users,
    Video,
} from 'lucide-react';
import { useState } from 'react';
import BackLink from '@/components/back-link';

interface Courseware {
    id: number;
    subject: string;
}

interface Participation {
    id: number;
    student_name: string;
    joined_at: string;
    left_at: string | null;
    duration_seconds: number | null;
}

interface ChatMessage {
    id: number;
    author_name: string;
    body: string;
    sent_at: string;
}

type RecordMode = 'auto' | 'manual';
type RecordingStatus =
    'not_recording' | 'recording' | 'stopped' | 'unavailable';

interface MeetingSessionRow {
    id: number;
    started_at: string;
    ended_at: string | null;
    record_mode: RecordMode;
    recording_status: RecordingStatus;
    recording_url: string | null;
    participations: Participation[];
    chat_messages: ChatMessage[];
}

interface MeetingRecordsProps {
    courseware: Courseware;
    sessions: MeetingSessionRow[];
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

function formatDuration(seconds: number | null): string {
    if (seconds === null) {
        return 'Still in meeting';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
        return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
}

const RECORDING_LABELS: Record<RecordingStatus, string> = {
    not_recording: 'Not recorded',
    recording: 'Recording in progress',
    stopped: 'Recording stopped',
    unavailable: 'Recording unavailable',
};

function RecordingUrlForm({
    coursewareId,
    sessionId,
}: {
    coursewareId: number;
    sessionId: number;
}) {
    const { data, setData, post, processing, reset } = useForm({
        recording_url: '',
    });

    const submit = () => {
        post(
            `/professor/courses/${coursewareId}/meeting/sessions/${sessionId}/recording-url`,
            { preserveScroll: true, onSuccess: () => reset() },
        );
    };

    return (
        <div className="flex flex-col gap-2 sm:flex-row">
            <input
                type="url"
                value={data.recording_url}
                onChange={(event) =>
                    setData('recording_url', event.target.value)
                }
                placeholder="Paste the uploaded recording link (Drive, etc.)"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
                type="button"
                onClick={submit}
                disabled={processing || data.recording_url === ''}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Save link
            </button>
        </div>
    );
}

export default function MeetingRecords({
    courseware,
    sessions,
}: MeetingRecordsProps) {
    const [expandedId, setExpandedId] = useState<number | null>(
        sessions[0]?.id ?? null,
    );

    return (
        <>
            <Head title={`Meeting Records — ${courseware.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-4xl space-y-6">
                    <BackLink
                        href={`/professor/courses/${courseware.id}/meeting`}
                    >
                        Back to meeting
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <FileVideo className="size-4" />
                            Meeting Records
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {courseware.subject}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            Every past class session for this subject — who
                            attended, for how long, what was said in chat, and
                            the recording once it's available.
                        </p>
                    </section>

                    {sessions.length === 0 ? (
                        <section className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
                            <Video className="size-10 text-slate-300" />
                            <h3 className="mt-3 font-semibold text-slate-700">
                                No class sessions yet
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Sessions appear here once you start a meeting
                                from this subject.
                            </p>
                        </section>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => {
                                const isExpanded = expandedId === session.id;

                                return (
                                    <section
                                        key={session.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedId(
                                                    isExpanded
                                                        ? null
                                                        : session.id,
                                                )
                                            }
                                            className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                                        >
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {formatDateTime(
                                                        session.started_at,
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {session.ended_at
                                                        ? `Ended ${formatDateTime(session.ended_at)}`
                                                        : 'Still live'}
                                                    {' · '}
                                                    {session.record_mode ===
                                                    'auto'
                                                        ? 'Auto-record'
                                                        : 'Manual record'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                    <Users className="size-3.5" />
                                                    {
                                                        session.participations
                                                            .length
                                                    }
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                    <Disc className="size-3.5" />
                                                    {
                                                        RECORDING_LABELS[
                                                            session
                                                                .recording_status
                                                        ]
                                                    }
                                                </span>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="space-y-6 border-t border-slate-200 p-5">
                                                <div>
                                                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                                        <FileVideo className="size-4 text-red-600" />
                                                        Recording
                                                    </h3>
                                                    {session.recording_url ? (
                                                        <a
                                                            href={
                                                                session.recording_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                        >
                                                            <Video className="size-4" />
                                                            Open recording
                                                        </a>
                                                    ) : (
                                                        <RecordingUrlForm
                                                            coursewareId={
                                                                courseware.id
                                                            }
                                                            sessionId={
                                                                session.id
                                                            }
                                                        />
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                                        <Users className="size-4 text-red-600" />
                                                        Participation
                                                    </h3>
                                                    {session.participations
                                                        .length > 0 ? (
                                                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                                                            <table className="w-full min-w-[500px] text-left text-sm">
                                                                <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                                                    <tr>
                                                                        <th className="px-3 py-2 font-semibold">
                                                                            Name
                                                                        </th>
                                                                        <th className="px-3 py-2 font-semibold">
                                                                            Joined
                                                                        </th>
                                                                        <th className="px-3 py-2 font-semibold">
                                                                            Left
                                                                        </th>
                                                                        <th className="px-3 py-2 font-semibold">
                                                                            Duration
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {session.participations.map(
                                                                        (
                                                                            participation,
                                                                        ) => (
                                                                            <tr
                                                                                key={
                                                                                    participation.id
                                                                                }
                                                                            >
                                                                                <td className="px-3 py-2 font-medium text-slate-900">
                                                                                    {
                                                                                        participation.student_name
                                                                                    }
                                                                                </td>
                                                                                <td className="px-3 py-2 text-slate-600">
                                                                                    {formatDateTime(
                                                                                        participation.joined_at,
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-slate-600">
                                                                                    {formatDateTime(
                                                                                        participation.left_at,
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-slate-600">
                                                                                    {formatDuration(
                                                                                        participation.duration_seconds,
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
                                                            Nobody's join/leave
                                                            activity was
                                                            recorded for this
                                                            session.
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                                        <MessageSquare className="size-4 text-red-600" />
                                                        Chat
                                                    </h3>
                                                    {session.chat_messages
                                                        .length > 0 ? (
                                                        <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                                                            {session.chat_messages.map(
                                                                (message) => (
                                                                    <li
                                                                        key={
                                                                            message.id
                                                                        }
                                                                        className="text-sm"
                                                                    >
                                                                        <span className="font-semibold text-slate-900">
                                                                            {
                                                                                message.author_name
                                                                            }
                                                                        </span>
                                                                        <span className="ml-2 text-xs text-slate-400">
                                                                            <Clock className="mr-1 inline size-3" />
                                                                            {formatDateTime(
                                                                                message.sent_at,
                                                                            )}
                                                                        </span>
                                                                        <p className="text-slate-600">
                                                                            {
                                                                                message.body
                                                                            }
                                                                        </p>
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-slate-500">
                                                            No chat messages
                                                            were sent during
                                                            this session.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
