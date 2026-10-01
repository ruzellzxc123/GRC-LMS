import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Eye,
    File as FileIcon,
    Save,
    Sparkles,
    UploadCloud,
    Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import BackLink from '@/components/back-link';
import ContentItemCard from '@/components/content-item-card';
import type { CommentItem } from '@/components/content-comment-thread';
import { useCourseUpdates } from '@/hooks/use-live-updates';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';

type UploadPreview =
    | { kind: 'image'; url: string }
    | { kind: 'pdf'; url: string }
    | { kind: 'text'; text: string }
    | { kind: 'unsupported' }
    | null;

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ContentItem {
    id: number;
    title: string;
    description: string | null;
    link: string | null;
    file_url: string | null;
    file_name: string | null;
    is_published: boolean;
    timing_mode: 'timestamp' | 'timer';
    time_limit_minutes: number | null;
    work_type: 'assignment' | 'activity' | 'learning_material';
    delivery_mode: 'hyflex' | 'asynchronous';
    week: number | null;
    hyflex_mode: 'f2f' | 'online' | null;
    submissions_count: number;
    comments: CommentItem[];
    quiz: {
        id: number;
        title: string;
        is_published: boolean;
        questions_count: number;
    } | null;
}

interface ContentCategory {
    id: number;
    name: string;
    requires_submission: boolean;
    items: ContentItem[];
}

interface Courseware {
    id: number;
    subject: string;
    year_level: string | null;
    section: string | null;
    meeting_link: string;
    uses_embedded_meeting: boolean;
}

interface PageProps {
    errors: Record<string, string>;
    [key: string]: unknown;
}

interface CourseContentProps {
    courseware: Courseware;
    categories: ContentCategory[];
}

export default function CourseContent({
    courseware,
    categories,
}: CourseContentProps) {
    useCourseUpdates(courseware.id);

    const { errors } = usePage<PageProps>().props;
    const [activeCategoryId, setActiveCategoryId] = useState(
        categories[0]?.id ?? null,
    );

    const activeCategory =
        categories.find((category) => category.id === activeCategoryId) ??
        categories[0] ??
        null;

    const weekGroups = useMemo(() => {
        if (!activeCategory) {
            return [];
        }

        const groups = new Map<number | null, ContentItem[]>();

        for (const item of activeCategory.items) {
            const existing = groups.get(item.week);

            if (existing) {
                existing.push(item);
            } else {
                groups.set(item.week, [item]);
            }
        }

        return Array.from(groups.entries()).sort(([a], [b]) => {
            if (a === null) {
                return 1;
            }

            if (b === null) {
                return -1;
            }

            return a - b;
        });
    }, [activeCategory]);

    const [collapsedWeeks, setCollapsedWeeks] = useState<
        Set<number | null>
    >(new Set());

    const toggleWeek = (week: number | null) => {
        setCollapsedWeeks((current) => {
            const next = new Set(current);

            if (next.has(week)) {
                next.delete(week);
            } else {
                next.add(week);
            }

            return next;
        });
    };

    // Upload New modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadWorkType, setUploadWorkType] = useState<
        'assignment' | 'activity' | 'learning_material'
    >('activity');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadLink, setUploadLink] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<UploadPreview>(null);
    const [uploadProcessing, setUploadProcessing] = useState(false);
    const [uploadPublishIntent, setUploadPublishIntent] = useState(false);
    const [uploadNext, setUploadNext] = useState<
        'quiz_create' | 'quiz_import' | null
    >(null);
    const [uploadTimingMode, setUploadTimingMode] = useState<
        'timestamp' | 'timer'
    >('timestamp');
    const [uploadTimeLimitMinutes, setUploadTimeLimitMinutes] = useState('');
    const [uploadDeadline, setUploadDeadline] = useState('');
    const [uploadMaxPoints, setUploadMaxPoints] = useState('');

    useEffect(() => {
        if (!uploadFile) {
            setUploadPreview(null);

            return;
        }

        if (uploadFile.type.startsWith('image/')) {
            const url = URL.createObjectURL(uploadFile);
            setUploadPreview({ kind: 'image', url });

            return () => URL.revokeObjectURL(url);
        }

        if (uploadFile.type === 'application/pdf') {
            const url = URL.createObjectURL(uploadFile);
            setUploadPreview({ kind: 'pdf', url });

            return () => URL.revokeObjectURL(url);
        }

        if (uploadFile.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = () => {
                setUploadPreview({
                    kind: 'text',
                    text: String(reader.result ?? '').slice(0, 2000),
                });
            };
            reader.readAsText(uploadFile);

            return;
        }

        setUploadPreview({ kind: 'unsupported' });
    }, [uploadFile]);

    const resetUploadForm = () => {
        setUploadTitle('');
        setUploadWorkType('activity');
        setUploadDescription('');
        setUploadLink('');
        setUploadFile(null);
        setUploadTimingMode('timestamp');
        setUploadTimeLimitMinutes('');
        setUploadDeadline('');
        setUploadMaxPoints('');
        setUploadNext(null);
    };

    const submitUpload = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!activeCategory) {
            return;
        }

        setUploadProcessing(true);

        router.post(
            `/professor/courses/${courseware.id}/content/categories/${activeCategory.id}/items`,
            {
                title: uploadTitle,
                work_type: uploadWorkType,
                description: uploadDescription || null,
                link: uploadLink || null,
                file: uploadFile,
                is_published: uploadPublishIntent,
                timing_mode: uploadTimingMode,
                time_limit_minutes:
                    uploadTimingMode === 'timer' &&
                    uploadTimeLimitMinutes !== ''
                        ? Number(uploadTimeLimitMinutes)
                        : null,
                deadline: uploadDeadline || null,
                max_points:
                    uploadWorkType === 'learning_material'
                        ? 100
                        : uploadMaxPoints || 100,
                next: uploadNext,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    setShowUploadModal(false);
                    resetUploadForm();
                },
                onFinish: () => setUploadProcessing(false),
            },
        );
    };

    const togglePublish = (item: ContentItem) => {
        router.patch(
            `/professor/courses/${courseware.id}/content/items/${item.id}/publish`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={`Content — ${courseware.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1200px] space-y-6">
                    <BackLink
                        href={`/professor/courses/${courseware.id}/roster`}
                    >
                        Back to roster
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <Sparkles className="size-4" />
                                    Subject Content
                                </div>
                                <h1 className="mt-2 text-2xl font-bold">
                                    {courseware.subject}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                                        {courseware.year_level ??
                                            'Year level unassigned'}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                                        Section{' '}
                                        {courseware.section ?? 'unassigned'}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-red-100">
                                    Upload materials and activities under
                                    Prelims, Midterm, or Finals — students can
                                    submit work for anything posted here. New
                                    uploads start as drafts — publish them when
                                    you're ready for students to see them.
                                </p>
                            </div>

                            {courseware.uses_embedded_meeting ? (
                                <Link
                                    href={`/professor/courses/${courseware.id}/meeting`}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                                >
                                    <Video className="size-4" />
                                    Join Class
                                </Link>
                            ) : (
                                <a
                                    href={courseware.meeting_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                                >
                                    <Video className="size-4" />
                                    Join Class
                                </a>
                            )}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-5">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() =>
                                        setActiveCategoryId(category.id)
                                    }
                                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                        activeCategory?.id === category.id
                                            ? 'bg-red-600 text-white'
                                            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {category.name}
                                    <span className="ml-1.5 text-xs opacity-75">
                                        ({category.items.length})
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="p-5">
                            {activeCategory ? (
                                <>
                                    <div className="flex items-center justify-between gap-4">
                                        <h2 className="font-semibold text-slate-900">
                                            {activeCategory.name}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowUploadModal(true)
                                            }
                                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                        >
                                            <UploadCloud className="size-4" />
                                            Upload New
                                        </button>
                                    </div>

                                    {activeCategory.items.length > 0 ? (
                                        <div className="mt-4 space-y-4">
                                            {weekGroups.map(
                                                ([week, items]) => (
                                                    <div
                                                        key={week ?? 'unscheduled'}
                                                        className="overflow-hidden rounded-xl border border-slate-200"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleWeek(
                                                                    week,
                                                                )
                                                            }
                                                            className="flex w-full items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-left hover:bg-slate-100"
                                                        >
                                                            <h3 className="text-sm font-bold text-slate-700">
                                                                {week !== null
                                                                    ? `Week ${week}`
                                                                    : 'Unscheduled'}
                                                                <span className="ml-1.5 font-normal text-slate-400">
                                                                    (
                                                                    {
                                                                        items.length
                                                                    }
                                                                    )
                                                                </span>
                                                            </h3>
                                                            {collapsedWeeks.has(
                                                                week,
                                                            ) ? (
                                                                <ChevronRight className="size-4 shrink-0 text-slate-500" />
                                                            ) : (
                                                                <ChevronDown className="size-4 shrink-0 text-slate-500" />
                                                            )}
                                                        </button>
                                                        {!collapsedWeeks.has(
                                                            week,
                                                        ) && (
                                                        <div className="grid gap-3 p-4">
                                                            {items.map(
                                                                (item) => (
                                                                    <ContentItemCard
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        item={
                                                                            item
                                                                        }
                                                                        requiresSubmission={
                                                                            activeCategory.requires_submission
                                                                        }
                                                                        onTogglePublish={() =>
                                                                            togglePublish(
                                                                                item,
                                                                            )
                                                                        }
                                                                        editHref={`/professor/courses/${courseware.id}/content/items/${item.id}/edit`}
                                                                        submissionsHref={`/professor/courses/${courseware.id}/content/items/${item.id}/submissions`}
                                                                        commentsPostUrl={`/professor/courses/${courseware.id}/content/items/${item.id}/comments`}
                                                                        quizEditHrefBase="/professor/quizzes"
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="mt-6 text-center text-sm text-slate-500">
                                            No items in this category yet.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-center text-sm text-slate-500">
                                    No categories yet.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <Dialog
                open={showUploadModal}
                onOpenChange={(open) => {
                    setShowUploadModal(open);

                    if (!open) {
                        resetUploadForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] max-w-2xl gap-4 overflow-y-auto p-0">
                    <div className="border-b border-slate-200 p-6 pb-4">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                            <UploadCloud className="size-5 text-red-600" />
                            Upload to {activeCategory?.name}
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-slate-500">
                            Import a file, preview it, then choose to save it as
                            a draft or publish it right away.
                        </DialogDescription>
                    </div>

                    <form
                        onSubmit={submitUpload}
                        className="grid gap-5 px-6 pb-6"
                    >
                        <div className="grid gap-1.5">
                            <label
                                htmlFor="upload_title"
                                className="text-xs font-medium text-slate-600"
                            >
                                Title
                            </label>
                            <input
                                id="upload_title"
                                value={uploadTitle}
                                onChange={(event) =>
                                    setUploadTitle(event.target.value)
                                }
                                required
                                autoFocus
                                placeholder="e.g. Week 1 — Introduction"
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                            {errors.title && (
                                <p className="text-xs text-red-600">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <label
                                htmlFor="upload_work_type"
                                className="text-xs font-medium text-slate-600"
                            >
                                Type
                            </label>
                            <select
                                id="upload_work_type"
                                value={uploadWorkType}
                                onChange={(event) =>
                                    setUploadWorkType(
                                        event.target.value as
                                            | 'assignment'
                                            | 'activity'
                                            | 'learning_material',
                                    )
                                }
                                required
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            >
                                <option value="activity">Activity</option>
                                <option value="assignment">Assignment</option>
                                <option value="learning_material">
                                    Learning Material
                                </option>
                            </select>
                            <p className="text-xs text-slate-500">
                                {uploadWorkType === 'learning_material'
                                    ? "Just a resource for students to read — no points, no quiz, no submission required."
                                    : 'Gradable work — set a point total below, and optionally attach a quiz.'}
                            </p>
                            {errors.work_type && (
                                <p className="text-xs text-red-600">
                                    {errors.work_type}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <label
                                htmlFor="upload_description"
                                className="text-xs font-medium text-slate-600"
                            >
                                Description (optional)
                            </label>
                            <textarea
                                id="upload_description"
                                value={uploadDescription}
                                onChange={(event) =>
                                    setUploadDescription(event.target.value)
                                }
                                rows={3}
                                placeholder="Notes for students about this item"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                            {errors.description && (
                                <p className="text-xs text-red-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <label
                                htmlFor="upload_timing_mode"
                                className="text-xs font-medium text-slate-600"
                            >
                                Timing
                            </label>
                            <select
                                id="upload_timing_mode"
                                value={uploadTimingMode}
                                onChange={(event) =>
                                    setUploadTimingMode(
                                        event.target.value as
                                            'timestamp' | 'timer',
                                    )
                                }
                                required
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            >
                                <option value="timestamp">
                                    Timestamp — just record how long each
                                    student takes
                                </option>
                                <option value="timer">
                                    Timer — give students a time limit once they
                                    open it
                                </option>
                            </select>
                            {errors.timing_mode && (
                                <p className="text-xs text-red-600">
                                    {errors.timing_mode}
                                </p>
                            )}
                        </div>

                        {uploadTimingMode === 'timer' && (
                            <div className="grid gap-1.5">
                                <label
                                    htmlFor="upload_time_limit_minutes"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Time Limit (minutes)
                                </label>
                                <input
                                    id="upload_time_limit_minutes"
                                    type="number"
                                    min={1}
                                    max={600}
                                    value={uploadTimeLimitMinutes}
                                    onChange={(event) =>
                                        setUploadTimeLimitMinutes(
                                            event.target.value,
                                        )
                                    }
                                    required
                                    placeholder="e.g. 30"
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                />
                                {errors.time_limit_minutes && (
                                    <p className="text-xs text-red-600">
                                        {errors.time_limit_minutes}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="grid gap-1.5">
                            <label
                                htmlFor="upload_deadline"
                                className="text-xs font-medium text-slate-600"
                            >
                                Submission Deadline (optional)
                            </label>
                            <input
                                id="upload_deadline"
                                type="datetime-local"
                                value={uploadDeadline}
                                onChange={(event) =>
                                    setUploadDeadline(event.target.value)
                                }
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                            <p className="text-xs text-slate-500">
                                Students can't submit past this date unless you
                                grant them a late exception.
                            </p>
                            {errors.deadline && (
                                <p className="text-xs text-red-600">
                                    {errors.deadline}
                                </p>
                            )}
                        </div>

                        {uploadWorkType !== 'learning_material' && (
                            <div className="grid gap-1.5">
                                <label
                                    htmlFor="upload_max_points"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Total Points
                                </label>
                                <input
                                    id="upload_max_points"
                                    type="number"
                                    min={1}
                                    value={uploadMaxPoints}
                                    onChange={(event) =>
                                        setUploadMaxPoints(event.target.value)
                                    }
                                    placeholder="100"
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                />
                                <p className="text-xs text-slate-500">
                                    What this item is graded out of — defaults
                                    to 100 if left blank.
                                </p>
                                {errors.max_points && (
                                    <p className="text-xs text-red-600">
                                        {errors.max_points}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="grid gap-1.5">
                            <label
                                htmlFor="upload_file"
                                className="text-xs font-medium text-slate-600"
                            >
                                Import a file (optional)
                            </label>
                            <input
                                id="upload_file"
                                type="file"
                                onChange={(event) =>
                                    setUploadFile(
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
                            />
                            {errors.file && (
                                <p className="text-xs text-red-600">
                                    {errors.file}
                                </p>
                            )}
                        </div>

                        {uploadFile && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-3 text-xs font-medium text-slate-600">
                                    Preview — this is what students will see
                                    once published
                                </p>

                                {uploadPreview?.kind === 'image' && (
                                    <img
                                        src={uploadPreview.url}
                                        alt={uploadFile.name}
                                        className="max-h-80 rounded-lg border border-slate-200 object-contain"
                                    />
                                )}

                                {uploadPreview?.kind === 'pdf' && (
                                    <iframe
                                        src={uploadPreview.url}
                                        title={uploadFile.name}
                                        className="h-96 w-full rounded-lg border border-slate-200 bg-white"
                                    />
                                )}

                                {uploadPreview?.kind === 'text' && (
                                    <pre className="max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap text-slate-700">
                                        {uploadPreview.text}
                                    </pre>
                                )}

                                {uploadPreview?.kind === 'unsupported' && (
                                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                                        <FileIcon className="size-8 shrink-0 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {uploadFile.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatBytes(uploadFile.size)} —
                                                no inline preview for this file
                                                type, but students will be able
                                                to download it.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid gap-1.5">
                            <label
                                htmlFor="upload_link"
                                className="text-xs font-medium text-slate-600"
                            >
                                Link (optional)
                            </label>
                            <input
                                id="upload_link"
                                type="url"
                                value={uploadLink}
                                onChange={(event) =>
                                    setUploadLink(event.target.value)
                                }
                                placeholder="https://..."
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                            {errors.link && (
                                <p className="text-xs text-red-600">
                                    {errors.link}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                            <div className="flex gap-3">
                                {uploadWorkType !== 'learning_material' && (
                                    <>
                                        <button
                                            type="submit"
                                            onClick={() => {
                                                setUploadPublishIntent(false);
                                                setUploadNext('quiz_create');
                                            }}
                                            disabled={uploadProcessing}
                                            className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <ClipboardList className="size-4" />
                                            Add Quiz
                                        </button>
                                        <button
                                            type="submit"
                                            onClick={() => {
                                                setUploadPublishIntent(false);
                                                setUploadNext('quiz_import');
                                            }}
                                            disabled={uploadProcessing}
                                            className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <UploadCloud className="size-4" />
                                            Import Quiz
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowUploadModal(false)}
                                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    onClick={() => {
                                        setUploadPublishIntent(false);
                                        setUploadNext(null);
                                    }}
                                    disabled={uploadProcessing}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save className="size-4" />
                                    {uploadProcessing
                                        ? 'Saving...'
                                        : 'Save as Draft'}
                                </button>
                                <button
                                    type="submit"
                                    onClick={() => {
                                        setUploadPublishIntent(true);
                                        setUploadNext(null);
                                    }}
                                    disabled={uploadProcessing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Eye className="size-4" />
                                    {uploadProcessing
                                        ? 'Saving...'
                                        : 'Publish Now'}
                                </button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
