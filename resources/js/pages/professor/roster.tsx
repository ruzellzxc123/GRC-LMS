import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarCheck,
    FolderKanban,
    GraduationCap,
    MessageSquarePlus,
    MoreHorizontal,
    Play,
    Save,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import BackLink from '@/components/back-link';

interface Courseware {
    id: number;
    subject: string;
    course_code: string | null;
    meeting_link: string | null;
    effective_meeting_link: string;
    uses_embedded_meeting: boolean;
}

interface PageProps {
    errors: Record<string, string>;
    [key: string]: unknown;
}

type RiskLabel = 'Excellent' | 'Good' | 'At Risk' | 'Critical';

interface RosterEntry {
    enrollment_id: number;
    student: {
        id: number;
        name: string;
        email: string;
        student_id: string | null;
    };
    attendance_rate: number | null;
    quiz_average: number | null;
    composite_score: number;
    label: RiskLabel;
    risk_level: 'low' | 'medium' | 'high';
}

interface RosterSummary {
    student_count: number;
    avg_attendance: number | null;
    avg_quiz_score: number | null;
    at_risk_count: number;
}

interface GradingSubmission {
    id: number;
    student_name: string;
    item_title: string;
    status: 'awaiting' | 'reviewed' | 'graded';
    score: number | null;
    submitted_at: string;
}

interface GradingSummary {
    awaiting_count: number;
    reviewed_count: number;
    graded_count: number;
    recent: GradingSubmission[];
}

interface RosterProps {
    courseware: Courseware;
    roster: RosterEntry[];
    summary: RosterSummary;
    grading: GradingSummary;
}

const LABEL_STYLES: Record<RiskLabel, string> = {
    Excellent: 'bg-emerald-100 text-emerald-700',
    Good: 'bg-sky-100 text-sky-700',
    'At Risk': 'bg-amber-100 text-amber-700',
    Critical: 'bg-red-100 text-red-700',
};

const barColor = (value: number | null): string => {
    if (value === null) {
        return 'bg-slate-200';
    }

    if (value >= 70) {
        return 'bg-emerald-500';
    }

    return value >= 50 ? 'bg-amber-500' : 'bg-red-500';
};

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

function MetricTile({
    icon: Icon,
    label,
    value,
    caption,
    tone = 'default',
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    caption: string;
    tone?: 'default' | 'warning';
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {label}
                </p>
                <span
                    className={`flex size-9 items-center justify-center rounded-full ${
                        tone === 'warning'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-red-50 text-red-700'
                    }`}
                >
                    <Icon className="size-4" />
                </span>
            </div>
            <p
                className={`mt-3 text-3xl font-bold ${tone === 'warning' ? 'text-red-600' : 'text-slate-900'}`}
            >
                {value}
            </p>
            <p className="mt-1.5 text-sm text-slate-500">{caption}</p>
        </div>
    );
}

function RosterRow({
    entry,
    rank,
    courseware,
}: {
    entry: RosterEntry;
    rank: number;
    courseware: Courseware;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative grid grid-cols-[2.5rem_1fr_repeat(3,7.5rem)_6.5rem_2.5rem] items-center gap-4 border-t border-slate-100 py-4 first:border-t-0 max-lg:grid-cols-[2rem_1fr_repeat(3,1fr)] max-sm:grid-cols-[1.75rem_1fr]">
            <span
                className={`text-lg font-bold ${entry.label === 'Critical' ? 'text-red-600' : 'text-slate-300'}`}
            >
                {String(rank).padStart(2, '0')}
            </span>

            <div className="min-w-0 max-sm:col-span-1">
                <p className="truncate font-semibold text-slate-900">
                    {entry.student.name}
                </p>
                <p className="text-xs text-slate-400">
                    {entry.student.student_id ?? entry.student.email}
                </p>
            </div>

            <div className="flex flex-col gap-1 max-sm:col-span-2">
                <span className="text-[0.65rem] font-semibold tracking-wide text-slate-400 uppercase">
                    Attendance
                </span>
                <span className="text-sm font-bold text-slate-700 tabular-nums">
                    {entry.attendance_rate !== null
                        ? `${entry.attendance_rate}%`
                        : '—'}
                </span>
                <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full rounded-full ${barColor(entry.attendance_rate)}`}
                        style={{ width: `${entry.attendance_rate ?? 0}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1 max-sm:col-span-2">
                <span className="text-[0.65rem] font-semibold tracking-wide text-slate-400 uppercase">
                    Quiz Avg
                </span>
                <span className="text-sm font-bold text-slate-700 tabular-nums">
                    {entry.quiz_average !== null
                        ? `${entry.quiz_average}%`
                        : '—'}
                </span>
                <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full rounded-full ${barColor(entry.quiz_average)}`}
                        style={{ width: `${entry.quiz_average ?? 0}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1 max-sm:col-span-2">
                <span className="text-[0.65rem] font-semibold tracking-wide text-slate-400 uppercase">
                    Composite
                </span>
                <span className="text-sm font-bold text-slate-700 tabular-nums">
                    {entry.composite_score}%
                </span>
                <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full rounded-full ${barColor(entry.composite_score)}`}
                        style={{ width: `${entry.composite_score}%` }}
                    />
                </div>
            </div>

            <span
                className={`w-fit justify-self-start rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap max-sm:col-span-2 ${LABEL_STYLES[entry.label]}`}
            >
                {entry.label}
            </span>

            <div className="relative justify-self-end max-sm:absolute max-sm:top-4 max-sm:right-0">
                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`More actions for ${entry.student.name}`}
                >
                    <MoreHorizontal className="size-4" />
                </button>

                {open && (
                    <>
                        <button
                            type="button"
                            aria-label="Close menu"
                            className="fixed inset-0 z-10 cursor-default"
                            onClick={() => setOpen(false)}
                        />
                        <div className="absolute top-full right-0 z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                            <Link
                                href={`/professor/courses/${courseware.id}/students/${entry.student.id}/feedback/create`}
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700"
                            >
                                <MessageSquarePlus className="size-4" />
                                Send Feedback
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function MeetingTile({ courseware }: { courseware: Courseware }) {
    const { errors } = usePage<PageProps>().props;
    const [meetingLink, setMeetingLink] = useState(
        courseware.meeting_link ?? '',
    );
    const [processing, setProcessing] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const saveMeeting = () => {
        setProcessing(true);

        router.put(
            `/professor/courses/${courseware.id}/meeting`,
            { meeting_link: meetingLink || null },
            {
                preserveScroll: true,
                onSuccess: () => setSettingsOpen(false),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        Live Meeting
                    </p>
                    <p className="mt-1.5 text-sm text-slate-500">
                        Jitsi room ready — no setup needed.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSettingsOpen((value) => !value)}
                        className="flex size-10 items-center justify-center rounded-full bg-red-50 text-red-700 hover:bg-red-100"
                        aria-label="Meeting link settings"
                    >
                        <MoreHorizontal className="size-5" />
                    </button>
                    {courseware.uses_embedded_meeting ? (
                        <Link
                            href={`/professor/courses/${courseware.id}/meeting`}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                        >
                            <Play className="size-4" />
                            Join
                        </Link>
                    ) : (
                        <a
                            href={courseware.effective_meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                        >
                            <Play className="size-4" />
                            Join
                        </a>
                    )}
                </div>
            </div>

            {settingsOpen && (
                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5">
                    <div className="grid min-w-56 flex-1 gap-1.5">
                        <label
                            htmlFor="meeting_link"
                            className="text-xs font-medium text-slate-500"
                        >
                            Custom meeting link (optional)
                        </label>
                        <input
                            id="meeting_link"
                            type="url"
                            value={meetingLink}
                            onChange={(event) =>
                                setMeetingLink(event.target.value)
                            }
                            placeholder="https://meet.google.com/xxx-yyyy-zzz"
                            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/15"
                        />
                        {errors.meeting_link && (
                            <p className="flex items-center gap-1.5 text-xs text-red-600">
                                <AlertTriangle className="size-3.5" />
                                {errors.meeting_link}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={saveMeeting}
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="size-4" />
                        {processing ? 'Saving...' : 'Save'}
                    </button>
                </div>
            )}
        </div>
    );
}

function GradingOversightTile({
    grading,
    onOpen,
}: {
    grading: GradingSummary;
    onOpen: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-red-200 hover:bg-red-50/40 sm:col-span-2"
        >
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Grading Oversight
            </p>
            <div className="mt-3 flex gap-8">
                <div>
                    <p className="text-2xl font-bold text-amber-600 tabular-nums">
                        {grading.awaiting_count}
                    </p>
                    <p className="text-xs text-slate-500">Awaiting review</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900 tabular-nums">
                        {grading.reviewed_count}
                    </p>
                    <p className="text-xs text-slate-500">Reviewed</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                        {grading.graded_count}
                    </p>
                    <p className="text-xs text-slate-500">Graded</p>
                </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">
                Tap to open ↑
            </p>
        </button>
    );
}

const STATUS_META: Record<
    GradingSubmission['status'],
    { label: string; className: string }
> = {
    awaiting: {
        label: 'Needs review',
        className: 'bg-amber-100 text-amber-700',
    },
    reviewed: { label: 'Reviewed', className: 'bg-slate-100 text-slate-600' },
    graded: { label: 'Complete', className: 'bg-emerald-100 text-emerald-700' },
};

function GradingOverlay({
    grading,
    open,
    onClose,
}: {
    grading: GradingSummary;
    open: boolean;
    onClose: () => void;
}) {
    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] transition-opacity duration-200 ${
                    open ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={`fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[78vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-8 shadow-[0_-20px_60px_-10px_rgba(32,26,21,0.4)] transition-transform duration-300 ${
                    open ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">
                        Grading Oversight
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {grading.recent.length > 0 ? (
                    <div>
                        {grading.recent.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between border-t border-slate-100 py-3.5 first:border-t-0"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">
                                        {item.student_name}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">
                                        {item.item_title} · submitted{' '}
                                        {formatDate(item.submitted_at)}
                                        {item.score !== null &&
                                            ` · ${item.score}%`}
                                    </p>
                                </div>
                                <span
                                    className={`ml-4 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_META[item.status].className}`}
                                >
                                    {STATUS_META[item.status].label}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-8 text-center text-sm text-slate-500">
                        No submissions yet for this subject.
                    </p>
                )}
            </div>
        </>
    );
}

export default function Roster({
    courseware,
    roster,
    summary,
    grading,
}: RosterProps) {
    const [gradingOpen, setGradingOpen] = useState(false);
    const worst = roster[0];

    return (
        <>
            <Head title={`Roster — ${courseware.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <BackLink href="/professor/dashboard">
                        Back to dashboard
                    </BackLink>

                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 text-sm font-medium text-red-100">
                                    <Users className="size-4" />
                                    Subject Roster &amp; Risk Engine
                                </div>
                                <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                                    {summary.at_risk_count > 0
                                        ? `${summary.at_risk_count} student${summary.at_risk_count === 1 ? '' : 's'} need${summary.at_risk_count === 1 ? 's' : ''} you this week.`
                                        : 'Every student in this subject is on track.'}
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-red-100 md:text-base">
                                    {courseware.subject}
                                    {courseware.course_code
                                        ? ` (${courseware.course_code})`
                                        : ''}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={`/professor/courses/${courseware.id}/content`}
                                    className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                                >
                                    <FolderKanban className="size-4" />
                                    Content
                                </Link>
                                <Link
                                    href={`/professor/courses/${courseware.id}/grades/prelims`}
                                    className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                                >
                                    <GraduationCap className="size-4" />
                                    Grades
                                </Link>
                                <Link
                                    href={`/professor/courses/${courseware.id}/attendance`}
                                    className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                                >
                                    <CalendarCheck className="size-4" />
                                    Take Attendance
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-red-700 to-red-500 p-6 text-white shadow-sm sm:col-span-2 sm:row-span-2">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-red-100 uppercase">
                                    Class Risk Temperature
                                </p>
                                <p className="mt-2 text-6xl font-bold tabular-nums">
                                    {summary.at_risk_count}
                                </p>
                                <p className="mt-3 max-w-xs text-sm text-red-100">
                                    student
                                    {summary.at_risk_count === 1
                                        ? ''
                                        : 's'}{' '}
                                    flagged high-risk out of{' '}
                                    {summary.student_count} enrolled — ranked
                                    worst-first below.
                                </p>
                            </div>
                            {worst && (
                                <div className="mt-6 flex w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold">
                                    <span className="relative flex size-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-200 opacity-75" />
                                        <span className="relative inline-flex size-1.5 rounded-full bg-red-100" />
                                    </span>
                                    Worst case: {worst.student.name} ·{' '}
                                    {worst.composite_score}% composite
                                </div>
                            )}
                        </div>

                        <MetricTile
                            icon={CalendarCheck}
                            label="Avg. Attendance"
                            value={
                                summary.avg_attendance !== null
                                    ? `${summary.avg_attendance}%`
                                    : '—'
                            }
                            caption={`across ${summary.student_count} students`}
                        />
                        <MetricTile
                            icon={GraduationCap}
                            label="Avg. Quiz Score"
                            value={
                                summary.avg_quiz_score !== null
                                    ? `${summary.avg_quiz_score}%`
                                    : '—'
                            }
                            caption="this term"
                        />

                        <GradingOversightTile
                            grading={grading}
                            onOpen={() => setGradingOpen(true)}
                        />
                        <MeetingTile courseware={courseware} />
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-2">
                            <h2 className="font-semibold text-slate-900">
                                Worst-First Ranking
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Composite score = attendance + quiz average +
                                profile completeness, weighted.
                            </p>
                        </div>

                        {roster.length > 0 ? (
                            <div>
                                {roster.map((entry, index) => (
                                    <RosterRow
                                        key={entry.enrollment_id}
                                        entry={entry}
                                        rank={index + 1}
                                        courseware={courseware}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-48 flex-col items-center justify-center text-center">
                                <Users className="size-10 text-slate-300" />
                                <h3 className="mt-3 font-semibold text-slate-700">
                                    No students enrolled yet
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Ask an admin to enroll students in this
                                    subject.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <GradingOverlay
                grading={grading}
                open={gradingOpen}
                onClose={() => setGradingOpen(false)}
            />
        </>
    );
}
