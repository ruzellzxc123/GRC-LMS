import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    Clock,
    FileText,
    FolderOpen,
    LinkIcon,
    PlayCircle,
    UploadCloud,
    Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import BackLink from '@/components/back-link';
import ContentCommentThread from '@/components/content-comment-thread';
import type { CommentItem } from '@/components/content-comment-thread';
import { WORK_TYPE_META } from '@/components/content-item-card';
import type { WorkType } from '@/components/content-item-card';
import { useCourseUpdates } from '@/hooks/use-live-updates';

interface Courseware {
    id: number;
    subject: string;
    module_title: string;
    professor: string;
    year_level: string | null;
    section: string | null;
    meeting_link: string | null;
    uses_embedded_meeting: boolean;
}

interface QuizSummary {
    id: number;
    title: string;
    deadline: string | null;
    attempted: boolean;
    score: number | null;
    correct_count: number | null;
    total_questions: number | null;
    can_attempt: boolean;
}

interface MySubmission {
    file_url: string;
    file_name: string;
    submitted_at: string;
    acknowledged_at: string | null;
    score: number | null;
    grade: number | null;
}

interface ContentItemViewData {
    started_at: string;
    finished_at: string | null;
    expires_at: string | null;
}

interface ContentItem {
    id: number;
    title: string;
    description: string | null;
    link: string | null;
    file_url: string | null;
    file_name: string | null;
    timing_mode: 'timestamp' | 'timer';
    time_limit_minutes: number | null;
    week: number | null;
    work_type: WorkType;
    delivery_mode: 'hyflex' | 'asynchronous';
    hyflex_mode: 'f2f' | 'online' | null;
    deadline: string | null;
    can_submit: boolean;
    max_points: number;
    view: ContentItemViewData | null;
    quiz: QuizSummary | null;
    my_submission: MySubmission | null;
    comments: CommentItem[];
}

interface ContentCategory {
    id: number;
    name: string;
    requires_submission: boolean;
    items: ContentItem[];
}

interface GradeOverviewCategory {
    name: string;
    weight: number;
    average: number | null;
}

interface GradeOverviewTerm {
    cumulative_grade: number | null;
    categories: GradeOverviewCategory[];
}

interface GradeOverview {
    prelims: GradeOverviewTerm;
    midterm: GradeOverviewTerm;
    finals: GradeOverviewTerm;
}

interface ShowCourseProps {
    courseware: Courseware;
    quizzes: QuizSummary[];
    content_categories: ContentCategory[];
    grade_overview: GradeOverview;
}

const TERM_LABELS: Record<keyof GradeOverview, string> = {
    prelims: 'Prelims',
    midterm: 'Midterm',
    finals: 'Finals',
};

function formatGrade(grade: number | null): string {
    return grade === null ? '—' : `${Math.round(grade)}%`;
}

function gradeTone(grade: number | null): string {
    if (grade === null) {
        return 'text-slate-400';
    }

    if (grade >= 85) {
        return 'text-emerald-600';
    }

    if (grade >= 70) {
        return 'text-slate-900';
    }

    if (grade >= 50) {
        return 'text-amber-600';
    }

    return 'text-red-600';
}

function formatDeadline(date: string | null): string {
    if (!date) {
        return 'No deadline';
    }

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

function isPastDeadline(date: string | null): boolean {
    return date !== null && new Date(date).getTime() < Date.now();
}

function HyflexModeBadge({ mode }: { mode: 'f2f' | 'online' | null }) {
    if (!mode) {
        return null;
    }

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                mode === 'f2f'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-cyan-100 text-cyan-700'
            }`}
        >
            {mode === 'f2f' ? 'Face-to-Face' : 'Synchronous'}
        </span>
    );
}

function AsynchronousBadge() {
    return (
        <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
            Asynchronous
        </span>
    );
}

function QuizRow({ quiz }: { quiz: QuizSummary }) {
    return (
        <li
            onClick={() => router.visit(`/student/quizzes/${quiz.id}`)}
            className="flex cursor-pointer items-center justify-between gap-3 py-3 first:pt-0 hover:opacity-80"
        >
            <div className="flex items-center gap-2">
                {quiz.attempted ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                    <ClipboardList className="size-4 shrink-0 text-red-600" />
                )}
                <div>
                    <p className="text-sm font-medium text-slate-900">
                        {quiz.title}
                    </p>
                    <p
                        className={`text-xs ${
                            !quiz.attempted && isPastDeadline(quiz.deadline)
                                ? 'font-semibold text-red-600'
                                : 'text-slate-500'
                        }`}
                    >
                        {formatDeadline(quiz.deadline)}
                    </p>
                </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-slate-600">
                {quiz.attempted
                    ? `${quiz.correct_count}/${quiz.total_questions}`
                    : !quiz.can_attempt
                      ? 'Past deadline'
                      : 'Not started'}
            </span>
        </li>
    );
}

function formatElapsed(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
        return `${seconds}s`;
    }

    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function startContentItem(itemId: number) {
    router.post(
        `/student/content/items/${itemId}/start`,
        {},
        { preserveScroll: true },
    );
}

function finishContentItem(itemId: number) {
    router.post(
        `/student/content/items/${itemId}/finish`,
        {},
        { preserveScroll: true, preserveState: true },
    );
}

function ContentItemTiming({
    item,
    hasClickableContent,
}: {
    item: ContentItem;
    hasClickableContent: boolean;
}) {
    const view = item.view;
    const [processing, setProcessing] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    const isFinished = view?.finished_at != null;

    useEffect(() => {
        if (!view || isFinished) {
            return;
        }

        const interval = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(interval);
    }, [view, isFinished]);

    if (!view) {
        // With a file or link to click, opening it is what starts the
        // timer (see the anchors above) — no separate button needed.
        if (hasClickableContent) {
            return (
                <p className="mt-2 text-xs text-slate-500">
                    {item.timing_mode === 'timer' && item.time_limit_minutes
                        ? `Not started — opening the file or link above starts your ${item.time_limit_minutes} min limit.`
                        : 'Not started — opening the file or link above begins tracking your reading time.'}
                </p>
            );
        }

        const startItem = () => {
            setProcessing(true);

            router.post(
                `/student/content/items/${item.id}/start`,
                {},
                { preserveScroll: true, onFinish: () => setProcessing(false) },
            );
        };

        return (
            <div className="mt-2">
                <button
                    type="button"
                    onClick={startItem}
                    disabled={processing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <PlayCircle className="size-3.5" />
                    {processing
                        ? 'Starting...'
                        : item.timing_mode === 'timer' &&
                            item.time_limit_minutes
                          ? `Start — ${item.time_limit_minutes} min limit`
                          : 'Start Reading'}
                </button>
            </div>
        );
    }

    if (view.finished_at) {
        const startedAt = new Date(view.started_at).getTime();
        const finishedAt = new Date(view.finished_at).getTime();
        const durationSeconds = Math.max(
            0,
            Math.round((finishedAt - startedAt) / 1000),
        );

        return (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                Finished in {formatElapsed(durationSeconds)}
            </div>
        );
    }

    const startedAt = new Date(view.started_at).getTime();
    const expiresAt = view.expires_at
        ? new Date(view.expires_at).getTime()
        : null;
    const isTimer = item.timing_mode === 'timer' && expiresAt !== null;
    const remainingSeconds = isTimer
        ? Math.max(0, Math.floor((expiresAt - now) / 1000))
        : null;
    const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
    const isOverdue = isTimer && remainingSeconds === 0;

    return (
        <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isOverdue
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600'
                }`}
            >
                <Clock className="size-3.5" />
                {isTimer
                    ? isOverdue
                        ? 'Time is up'
                        : `${formatElapsed(remainingSeconds ?? 0)} left`
                    : `Reading for ${formatElapsed(elapsedSeconds)}`}
            </span>
        </div>
    );
}

function SubmissionUpload({ item }: { item: ContentItem }) {
    const [processing, setProcessing] = useState(false);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setProcessing(true);

        router.post(
            `/student/content/items/${item.id}/submit`,
            { file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    event.target.value = '';
                },
            },
        );
    };

    return (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-800">
                Submission required
            </p>

            {item.my_submission ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm">
                    <a
                        href={item.my_submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800"
                    >
                        <FileText className="size-3.5" />
                        {item.my_submission.file_name}
                    </a>
                    <span className="text-xs text-slate-500">
                        Submitted{' '}
                        {new Intl.DateTimeFormat('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                        }).format(new Date(item.my_submission.submitted_at))}
                    </span>
                    {item.my_submission.acknowledged_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="size-3" />
                            Reviewed by professor{' '}
                            {new Intl.DateTimeFormat('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                            }).format(
                                new Date(item.my_submission.acknowledged_at),
                            )}
                        </span>
                    ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                            Not yet reviewed
                        </span>
                    )}
                    {item.my_submission.score !== null && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Grade: {item.my_submission.grade}% (
                            {item.my_submission.score}/{item.max_points})
                        </span>
                    )}
                </div>
            ) : (
                <p className="mt-1 text-xs text-slate-600">
                    You haven't submitted anything yet.
                </p>
            )}

            {item.can_submit ? (
                <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                    <UploadCloud className="size-3.5" />
                    {processing
                        ? 'Uploading...'
                        : item.my_submission
                          ? 'Replace submission'
                          : 'Upload submission'}
                    <input
                        type="file"
                        disabled={processing}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            ) : (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <p>
                        You're past the deadline for this submission. Please ask
                        your professor for permission to submit late.
                    </p>
                </div>
            )}
        </div>
    );
}

export default function ShowCourse({
    courseware,
    quizzes,
    content_categories,
    grade_overview,
}: ShowCourseProps) {
    useCourseUpdates(courseware.id);

    // Files and links open in a new tab, so "leaving" a module means this
    // tab loses and then regains focus/visibility — that's the closest
    // signal we have to the student being done reading it.
    const [pendingFinishId, setPendingFinishId] = useState<number | null>(null);

    useEffect(() => {
        const handleVisibility = () => {
            if (
                document.visibilityState === 'visible' &&
                pendingFinishId !== null
            ) {
                finishContentItem(pendingFinishId);
                setPendingFinishId(null);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () =>
            document.removeEventListener('visibilitychange', handleVisibility);
    }, [pendingFinishId]);

    const openContentItem = (item: ContentItem) => {
        if (!item.view) {
            startContentItem(item.id);
        }

        if (!item.view?.finished_at) {
            setPendingFinishId(item.id);
        }
    };

    // Every posted item — under Prelims, Midterm, or Finals — is a clickable
    // module, Classroom-style. A category's requires_submission flag now
    // applies per item opened, rather than routing "activities" to a
    // separate aggregate list: whatever's posted can itself ask for a
    // submission once opened.
    const materialItems = content_categories.flatMap((category) =>
        category.items.map((item) => ({
            item,
            categoryName: category.name,
            requiresSubmission: category.requires_submission,
        })),
    );

    // Deep-linked from the To-Do page ("?item=123") — jump straight to that
    // piece of classwork instead of landing on the plain list.
    const [selectedItemId, setSelectedItemId] = useState<number | null>(() => {
        const fromQuery = new URLSearchParams(window.location.search).get(
            'item',
        );

        return fromQuery ? Number(fromQuery) : null;
    });

    const selected = materialItems.find(
        ({ item }) => item.id === selectedItemId,
    );

    return (
        <>
            <Head title={courseware.subject} />

            <div className="min-h-full bg-red-50/30 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <BackLink href="/student/courses">
                        Back to subjects
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">
                                {courseware.subject}
                            </h1>
                            {courseware.meeting_link &&
                                (courseware.uses_embedded_meeting ? (
                                    <Link
                                        href={`/student/courses/${courseware.id}/meeting`}
                                        title="Join the online class"
                                        aria-label="Join the online class"
                                        className="inline-flex items-center justify-center rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                                    >
                                        <Video className="size-4" />
                                    </Link>
                                ) : (
                                    <a
                                        href={courseware.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Join the online class"
                                        aria-label="Join the online class"
                                        className="inline-flex items-center justify-center rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                                    >
                                        <Video className="size-4" />
                                    </a>
                                ))}
                        </div>
                        <p className="mt-2 text-sm text-red-100">
                            {courseware.module_title}
                        </p>
                        <p className="mt-1 text-sm text-red-100">
                            Professor: {courseware.professor}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                                {courseware.year_level ??
                                    'Year level unassigned'}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                                Section {courseware.section ?? 'unassigned'}
                            </span>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                            <h2 className="font-semibold text-slate-900">
                                Your Performance
                            </h2>
                            <Link
                                href={`/student/courses/${courseware.id}/grades/prelims`}
                                className="text-sm font-semibold text-red-700 hover:underline"
                            >
                                Full Breakdown →
                            </Link>
                        </div>
                        <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                            {(
                                Object.keys(TERM_LABELS) as Array<
                                    keyof GradeOverview
                                >
                            ).map((term) => {
                                const data = grade_overview[term];

                                return (
                                    <div key={term} className="p-5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                                                {TERM_LABELS[term]}
                                            </p>
                                            <p
                                                className={`text-lg font-bold ${gradeTone(data.cumulative_grade)}`}
                                            >
                                                {formatGrade(
                                                    data.cumulative_grade,
                                                )}
                                            </p>
                                        </div>
                                        <ul className="mt-3 space-y-1.5">
                                            {data.categories.map(
                                                (category) => (
                                                    <li
                                                        key={category.name}
                                                        className="flex items-center justify-between text-xs text-slate-600"
                                                    >
                                                        <span>
                                                            {category.name}{' '}
                                                            <span className="text-slate-400">
                                                                (
                                                                {
                                                                    category.weight
                                                                }
                                                                %)
                                                            </span>
                                                        </span>
                                                        <span
                                                            className={`font-semibold ${gradeTone(category.average)}`}
                                                        >
                                                            {formatGrade(
                                                                category.average,
                                                            )}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
                            <FolderOpen className="size-4 text-red-600" />
                            <h2 className="font-semibold text-slate-900">
                                Classwork
                            </h2>
                        </div>

                        {selected ? (
                            <div className="p-5">
                                <button
                                    type="button"
                                    onClick={() => setSelectedItemId(null)}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-700"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Back to classwork
                                </button>

                                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                                    {/* Module — the material the professor uploaded */}
                                    <div>
                                        <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-5">
                                            <span
                                                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${WORK_TYPE_META[selected.item.work_type].iconWrapClass}`}
                                            >
                                                {(() => {
                                                    const TypeIcon =
                                                        WORK_TYPE_META[
                                                            selected.item
                                                                .work_type
                                                        ].icon;
                                                    return (
                                                        <TypeIcon className="size-5" />
                                                    );
                                                })()}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                                                    {selected.categoryName}
                                                </p>
                                                <h3 className="mt-1 text-xl font-bold text-slate-900">
                                                    {selected.item.title}
                                                </h3>
                                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${WORK_TYPE_META[selected.item.work_type].badgeClass}`}
                                                    >
                                                        {
                                                            WORK_TYPE_META[
                                                                selected.item
                                                                    .work_type
                                                            ].label
                                                        }
                                                    </span>
                                                    {selected.item.week && (
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                            Week{' '}
                                                            {
                                                                selected.item
                                                                    .week
                                                            }
                                                        </span>
                                                    )}
                                                    <HyflexModeBadge
                                                        mode={
                                                            selected.item
                                                                .hyflex_mode
                                                        }
                                                    />
                                                    {selected.item
                                                        .delivery_mode ===
                                                        'asynchronous' && (
                                                        <AsynchronousBadge />
                                                    )}
                                                    {selected.requiresSubmission && (
                                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                                            Submission
                                                            required
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {selected.item.description && (
                                            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                                                    Instructions
                                                </p>
                                                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-slate-700">
                                                    {selected.item.description}
                                                </p>
                                            </div>
                                        )}

                                        {(selected.item.file_url ||
                                            selected.item.link) && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {selected.item.file_url && (
                                                    <a
                                                        href={
                                                            selected.item
                                                                .file_url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() =>
                                                            openContentItem(
                                                                selected.item,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <FileText className="size-3.5 text-red-600" />
                                                        {selected.item
                                                            .file_name ??
                                                            'Download file'}
                                                    </a>
                                                )}
                                                {selected.item.link && (
                                                    <a
                                                        href={
                                                            selected.item.link
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() =>
                                                            openContentItem(
                                                                selected.item,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <LinkIcon className="size-3.5 text-red-600" />
                                                        Open link
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <ContentItemTiming
                                            item={selected.item}
                                            hasClickableContent={Boolean(
                                                selected.item.file_url ||
                                                selected.item.link,
                                            )}
                                        />
                                        {selected.requiresSubmission && (
                                            <SubmissionUpload
                                                item={selected.item}
                                            />
                                        )}
                                        <ContentCommentThread
                                            comments={selected.item.comments}
                                            postUrl={`/student/content/items/${selected.item.id}/comments`}
                                        />
                                    </div>

                                    {/* Quiz — right beside the module material */}
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        {selected.item.quiz && (
                                            <div className="mb-4 border-b border-slate-200 pb-4">
                                                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                                    <ClipboardList className="size-4 text-red-600" />
                                                    This Module's Quiz
                                                </h4>
                                                <ul className="mt-2 divide-y divide-slate-200">
                                                    <QuizRow
                                                        quiz={
                                                            selected.item.quiz
                                                        }
                                                    />
                                                </ul>
                                            </div>
                                        )}

                                        <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                                            <ClipboardList className="size-4 text-red-600" />
                                            {selected.item.quiz
                                                ? 'Other Quizzes'
                                                : 'Quiz'}
                                        </h4>

                                        {quizzes.length > 0 ? (
                                            <ul className="mt-2 divide-y divide-slate-200">
                                                {quizzes.map((quiz) => (
                                                    <QuizRow
                                                        key={quiz.id}
                                                        quiz={quiz}
                                                    />
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="mt-2 text-sm text-slate-500">
                                                No quizzes published yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : materialItems.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {materialItems.map(
                                    ({
                                        item,
                                        categoryName,
                                        requiresSubmission,
                                    }) => (
                                        <li key={item.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedItemId(item.id)
                                                }
                                                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-red-50/40"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${WORK_TYPE_META[item.work_type].iconWrapClass}`}
                                                    >
                                                        {(() => {
                                                            const TypeIcon =
                                                                WORK_TYPE_META[
                                                                    item
                                                                        .work_type
                                                                ].icon;
                                                            return (
                                                                <TypeIcon className="size-4" />
                                                            );
                                                        })()}
                                                    </span>
                                                    <div>
                                                        {(item.week ||
                                                            item.hyflex_mode ||
                                                            item.delivery_mode ===
                                                                'asynchronous') && (
                                                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                                                {item.week && (
                                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                                        Week{' '}
                                                                        {
                                                                            item.week
                                                                        }
                                                                    </span>
                                                                )}
                                                                <HyflexModeBadge
                                                                    mode={
                                                                        item.hyflex_mode
                                                                    }
                                                                />
                                                                {item.delivery_mode ===
                                                                    'asynchronous' && (
                                                                    <AsynchronousBadge />
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-slate-900">
                                                                {item.title}
                                                            </p>
                                                            {requiresSubmission && (
                                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                                                    Submission
                                                                    required
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            {categoryName}
                                                        </p>
                                                    </div>
                                                </div>
                                                {item.view?.finished_at && (
                                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                                                )}
                                            </button>
                                        </li>
                                    ),
                                )}
                            </ul>
                        ) : (
                            <div className="flex min-h-32 flex-col items-center justify-center text-center">
                                <FolderOpen className="size-8 text-slate-300" />
                                <p className="mt-2 text-sm text-slate-500">
                                    No materials posted yet.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
