import { Link } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardCheck,
    ClipboardList,
    Eye,
    EyeOff,
    FileText,
    Layers,
    LinkIcon,
    Pencil,
} from 'lucide-react';
import ContentCommentThread from '@/components/content-comment-thread';
import type { CommentItem } from '@/components/content-comment-thread';

export type WorkType = 'assignment' | 'activity' | 'learning_material';

export const WORK_TYPE_META: Record<
    WorkType,
    {
        label: string;
        icon: typeof ClipboardCheck;
        badgeClass: string;
        iconWrapClass: string;
    }
> = {
    assignment: {
        label: 'Assignment',
        icon: ClipboardCheck,
        badgeClass: 'bg-indigo-100 text-indigo-700',
        iconWrapClass: 'bg-indigo-50 text-indigo-600',
    },
    activity: {
        label: 'Activity',
        icon: Layers,
        badgeClass: 'bg-teal-100 text-teal-700',
        iconWrapClass: 'bg-teal-50 text-teal-600',
    },
    learning_material: {
        label: 'Learning Material',
        icon: BookOpen,
        badgeClass: 'bg-fuchsia-100 text-fuchsia-700',
        iconWrapClass: 'bg-fuchsia-50 text-fuchsia-600',
    },
};

export interface ContentItemCardData {
    id: number;
    title: string;
    description: string | null;
    link: string | null;
    file_url: string | null;
    file_name: string | null;
    is_published: boolean;
    work_type: WorkType;
    delivery_mode: 'hyflex' | 'asynchronous';
    hyflex_mode: 'f2f' | 'online' | null;
    submissions_count: number;
    comments: CommentItem[];
    quiz?: {
        id: number;
        title: string;
        is_published: boolean;
        questions_count: number;
    } | null;
}

interface ContentItemCardProps {
    item: ContentItemCardData;
    requiresSubmission: boolean;
    onTogglePublish: () => void;
    editHref: string;
    submissionsHref: string;
    commentsPostUrl: string;
    /** Base path for the quiz edit link, e.g. "/professor/quizzes" — admin has no quiz feature, so this (and item.quiz) stays undefined there. */
    quizEditHrefBase?: string;
}

/**
 * One module/activity row in the Subject Content list — shared between the
 * professor and admin content pages so a redesign only has to happen once.
 * A type-colored icon avatar + bold title carries most of the visual
 * hierarchy that used to rely purely on small inline badges, so the module
 * a professor is looking for (and what a student would see when reading
 * it) is scannable at a glance instead of needing to parse a row of pills.
 */
export default function ContentItemCard({
    item,
    requiresSubmission,
    onTogglePublish,
    editHref,
    submissionsHref,
    commentsPostUrl,
    quizEditHrefBase,
}: ContentItemCardProps) {
    const meta = WORK_TYPE_META[item.work_type];
    const TypeIcon = meta.icon;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${meta.iconWrapClass}`}
                    >
                        <TypeIcon className="size-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {requiresSubmission ? (
                                <Link
                                    href={submissionsHref}
                                    title="View student submissions"
                                    className="text-base font-bold text-slate-900 hover:text-red-700 hover:underline"
                                >
                                    {item.title}
                                </Link>
                            ) : (
                                <p className="text-base font-bold text-slate-900">
                                    {item.title}
                                </p>
                            )}
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    item.is_published
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}
                            >
                                {item.is_published ? 'Published' : 'Draft'}
                            </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
                            >
                                {meta.label}
                            </span>
                            {item.hyflex_mode && (
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        item.hyflex_mode === 'f2f'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-cyan-100 text-cyan-700'
                                    }`}
                                >
                                    {item.hyflex_mode === 'f2f'
                                        ? 'Face-to-Face'
                                        : 'Synchronous'}
                                </span>
                            )}
                            {item.delivery_mode === 'asynchronous' && (
                                <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                                    Asynchronous
                                </span>
                            )}
                            {requiresSubmission && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                    Requires Submission
                                </span>
                            )}
                        </div>

                        {item.description && (
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                {item.description}
                            </p>
                        )}

                        {(item.file_url ||
                            item.link ||
                            requiresSubmission) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.file_url && (
                                    <a
                                        href={item.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                        <FileText className="size-3.5 text-red-600" />
                                        {item.file_name ?? 'Download file'}
                                    </a>
                                )}
                                {item.link && (
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                    >
                                        <LinkIcon className="size-3.5 text-red-600" />
                                        Open link
                                    </a>
                                )}
                                {requiresSubmission && (
                                    <Link
                                        href={submissionsHref}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                    >
                                        <ClipboardCheck className="size-3.5" />
                                        Submissions ({item.submissions_count})
                                    </Link>
                                )}
                            </div>
                        )}

                        {item.quiz && quizEditHrefBase && (
                            <Link
                                href={`${quizEditHrefBase}/${item.quiz.id}/edit`}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                            >
                                <ClipboardList className="size-3.5" />
                                Quiz: {item.quiz.title} (
                                {item.quiz.questions_count} questions
                                {item.quiz.is_published
                                    ? ', published'
                                    : ', draft'}
                                )
                            </Link>
                        )}

                        <div className="mt-3">
                            <ContentCommentThread
                                comments={item.comments}
                                postUrl={commentsPostUrl}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 gap-2">
                    <button
                        type="button"
                        onClick={onTogglePublish}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                            item.is_published
                                ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                    >
                        {item.is_published ? (
                            <>
                                <EyeOff className="size-3.5" />
                                Unpublish
                            </>
                        ) : (
                            <>
                                <Eye className="size-3.5" />
                                Publish
                            </>
                        )}
                    </button>
                    <Link
                        href={editHref}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                        <Pencil className="size-3.5" />
                        Edit
                    </Link>
                </div>
            </div>
        </div>
    );
}
