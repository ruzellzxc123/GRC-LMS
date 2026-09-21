import { Head, Link, router, usePage } from '@inertiajs/react';
import { File as FileIcon, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import BackLink from '@/components/back-link';

interface Courseware {
    id: number;
    subject: string;
    course_code: string | null;
}

interface Category {
    id: number;
    name: string;
}

interface ExistingItem {
    id: number;
    title: string;
    description: string | null;
    link: string | null;
    file_url: string | null;
    file_name: string | null;
    is_published: boolean;
    timing_mode: 'timestamp' | 'timer';
    time_limit_minutes: number | null;
    work_type: 'assignment' | 'activity';
    deadline: string | null;
    max_points: number;
}

interface PageProps {
    errors: Record<string, string>;
    [key: string]: unknown;
}

interface ContentUploadProps {
    courseware: Courseware;
    category: Category;
    item: ExistingItem;
}

type Preview =
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

export default function ContentUpload({
    courseware,
    category,
    item,
}: ContentUploadProps) {
    const { errors } = usePage<PageProps>().props;
    const [title, setTitle] = useState(item.title);
    const [workType, setWorkType] = useState<'assignment' | 'activity'>(
        item.work_type,
    );
    const [description, setDescription] = useState(item.description ?? '');
    const [link, setLink] = useState(item.link ?? '');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<Preview>(null);
    const [processing, setProcessing] = useState(false);
    const [timingMode, setTimingMode] = useState<'timestamp' | 'timer'>(
        item.timing_mode,
    );
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(
        item.time_limit_minutes ? String(item.time_limit_minutes) : '',
    );
    const [deadline, setDeadline] = useState(item.deadline ?? '');
    const [maxPoints, setMaxPoints] = useState(String(item.max_points));

    useEffect(() => {
        if (!file) {
            setPreview(null);

            return;
        }

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreview({ kind: 'image', url });

            return () => URL.revokeObjectURL(url);
        }

        if (file.type === 'application/pdf') {
            const url = URL.createObjectURL(file);
            setPreview({ kind: 'pdf', url });

            return () => URL.revokeObjectURL(url);
        }

        if (file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = () => {
                setPreview({
                    kind: 'text',
                    text: String(reader.result ?? '').slice(0, 2000),
                });
            };
            reader.readAsText(file);

            return;
        }

        setPreview({ kind: 'unsupported' });
    }, [file]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);

        router.post(
            `/admin/courses/${courseware.id}/content/items/${item.id}`,
            {
                title,
                work_type: workType,
                description: description || null,
                link: link || null,
                file,
                is_published: item.is_published,
                timing_mode: timingMode,
                time_limit_minutes:
                    timingMode === 'timer' && timeLimitMinutes !== ''
                        ? Number(timeLimitMinutes)
                        : null,
                deadline: deadline || null,
                max_points: maxPoints || 100,
                _method: 'put',
            },
            {
                forceFormData: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={`Edit ${category.name} — ${courseware.subject}`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <BackLink href={`/admin/courses/${courseware.id}/content`}>
                        Back to content
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            {courseware.subject}
                            {courseware.course_code
                                ? ` (${courseware.course_code})`
                                : ''}
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Edit {category.name}
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            Update the details below. This won't change whether
                            it's published — use the Publish/Unpublish button on
                            the Content page for that.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <form onSubmit={submit} className="grid gap-5 p-6">
                            <div className="grid gap-1.5">
                                <label
                                    htmlFor="title"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Title
                                </label>
                                <input
                                    id="title"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
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
                                    htmlFor="work_type"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Type
                                </label>
                                <select
                                    id="work_type"
                                    value={workType}
                                    onChange={(event) =>
                                        setWorkType(
                                            event.target.value as
                                                'assignment' | 'activity',
                                        )
                                    }
                                    required
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                >
                                    <option value="activity">Activity</option>
                                    <option value="assignment">
                                        Assignment
                                    </option>
                                </select>
                                {errors.work_type && (
                                    <p className="text-xs text-red-600">
                                        {errors.work_type}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <label
                                    htmlFor="description"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Description (optional)
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
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
                                    htmlFor="timing_mode"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Timing
                                </label>
                                <select
                                    id="timing_mode"
                                    value={timingMode}
                                    onChange={(event) =>
                                        setTimingMode(
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
                                        Timer — give students a time limit once
                                        they open it
                                    </option>
                                </select>
                                {errors.timing_mode && (
                                    <p className="text-xs text-red-600">
                                        {errors.timing_mode}
                                    </p>
                                )}
                            </div>

                            {timingMode === 'timer' && (
                                <div className="grid gap-1.5">
                                    <label
                                        htmlFor="time_limit_minutes"
                                        className="text-xs font-medium text-slate-600"
                                    >
                                        Time Limit (minutes)
                                    </label>
                                    <input
                                        id="time_limit_minutes"
                                        type="number"
                                        min={1}
                                        max={600}
                                        value={timeLimitMinutes}
                                        onChange={(event) =>
                                            setTimeLimitMinutes(
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
                                    htmlFor="deadline"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Submission Deadline (optional)
                                </label>
                                <input
                                    id="deadline"
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(event) =>
                                        setDeadline(event.target.value)
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                />
                                <p className="text-xs text-slate-500">
                                    Students can't submit past this date unless
                                    they're granted a late exception.
                                </p>
                                {errors.deadline && (
                                    <p className="text-xs text-red-600">
                                        {errors.deadline}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <label
                                    htmlFor="max_points"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Total Points
                                </label>
                                <input
                                    id="max_points"
                                    type="number"
                                    min={1}
                                    value={maxPoints}
                                    onChange={(event) =>
                                        setMaxPoints(event.target.value)
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

                            <div className="grid gap-1.5">
                                <label
                                    htmlFor="file"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    {item.file_name
                                        ? 'Replace file (optional)'
                                        : 'Import a file (optional)'}
                                </label>
                                {item.file_name && !file && (
                                    <p className="text-xs text-slate-500">
                                        Currently attached:{' '}
                                        <a
                                            href={item.file_url ?? undefined}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-red-700 hover:text-red-800"
                                        >
                                            {item.file_name}
                                        </a>{' '}
                                        — choose a new file to replace it, or
                                        leave this blank to keep it.
                                    </p>
                                )}
                                <input
                                    id="file"
                                    type="file"
                                    onChange={(event) =>
                                        setFile(event.target.files?.[0] ?? null)
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
                                />
                                {errors.file && (
                                    <p className="text-xs text-red-600">
                                        {errors.file}
                                    </p>
                                )}
                            </div>

                            {file && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="mb-3 text-xs font-medium text-slate-600">
                                        Preview — this is what students will see
                                        once published
                                    </p>

                                    {preview?.kind === 'image' && (
                                        <img
                                            src={preview.url}
                                            alt={file.name}
                                            className="max-h-80 rounded-lg border border-slate-200 object-contain"
                                        />
                                    )}

                                    {preview?.kind === 'pdf' && (
                                        <iframe
                                            src={preview.url}
                                            title={file.name}
                                            className="h-96 w-full rounded-lg border border-slate-200 bg-white"
                                        />
                                    )}

                                    {preview?.kind === 'text' && (
                                        <pre className="max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap text-slate-700">
                                            {preview.text}
                                        </pre>
                                    )}

                                    {preview?.kind === 'unsupported' && (
                                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                                            <FileIcon className="size-8 shrink-0 text-slate-400" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatBytes(file.size)} —
                                                    no inline preview for this
                                                    file type, but students will
                                                    be able to download it.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-1.5">
                                <label
                                    htmlFor="link"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Link (optional)
                                </label>
                                <input
                                    id="link"
                                    type="url"
                                    value={link}
                                    onChange={(event) =>
                                        setLink(event.target.value)
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

                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                                <Link
                                    href={`/admin/courses/${courseware.id}/content`}
                                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save className="size-4" />
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </>
    );
}
