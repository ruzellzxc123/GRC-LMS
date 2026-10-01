import { Head } from '@inertiajs/react';
import {
    Archive,
    Eye,
    EyeOff,
    FileText,
    FolderOpen,
    LinkIcon,
} from 'lucide-react';
import { useState } from 'react';
import BackLink from '@/components/back-link';

interface ContentItem {
    id: number;
    title: string;
    description: string | null;
    link: string | null;
    file_url: string | null;
    file_name: string | null;
    is_published: boolean;
}

interface ContentCategory {
    id: number;
    name: string;
    items: ContentItem[];
}

interface Courseware {
    id: number;
    subject: string;
    subject_code: string | null;
    module_title: string;
    year_level: string | null;
    section: string | null;
    archived_at: string | null;
    professor: string;
    professor_id: number | null;
}

interface ArchivedShowProps {
    courseware: Courseware;
    categories: ContentCategory[];
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

export default function ArchivedShow({
    courseware,
    categories,
}: ArchivedShowProps) {
    const [activeCategoryId, setActiveCategoryId] = useState(
        categories[0]?.id ?? null,
    );

    const activeCategory =
        categories.find((category) => category.id === activeCategoryId) ??
        categories[0] ??
        null;

    return (
        <>
            <Head title={`${courseware.subject} (Archived)`} />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1200px] space-y-6">
                    <BackLink
                        href={
                            courseware.professor_id
                                ? `/admin/archived/professors/${courseware.professor_id}`
                                : '/admin/archived'
                        }
                    >
                        Back to archived subjects
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-slate-700 to-slate-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-slate-200">
                            <Archive className="size-4" />
                            Archived · Read-only
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {courseware.subject}
                        </h1>
                        <p className="mt-2 text-sm text-slate-200">
                            {courseware.professor}
                            {courseware.section
                                ? ` · Section ${courseware.section}`
                                : ''}
                        </p>
                        <p className="mt-1 text-xs text-slate-300">
                            Archived {formatDate(courseware.archived_at)}
                        </p>
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
                                            ? 'bg-slate-700 text-white'
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
                            {activeCategory &&
                            activeCategory.items.length > 0 ? (
                                <ul className="divide-y divide-slate-100">
                                    {activeCategory.items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="py-4 first:pt-0"
                                        >
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-900">
                                                    {item.title}
                                                </p>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                        item.is_published
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {item.is_published ? (
                                                        <Eye className="size-3" />
                                                    ) : (
                                                        <EyeOff className="size-3" />
                                                    )}
                                                    {item.is_published
                                                        ? 'Published'
                                                        : 'Draft'}
                                                </span>
                                            </div>
                                            {item.description && (
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="mt-2 flex flex-wrap gap-4">
                                                {item.file_url && (
                                                    <a
                                                        href={item.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
                                                    >
                                                        <FileText className="size-3.5" />
                                                        {item.file_name ??
                                                            'Download file'}
                                                    </a>
                                                )}
                                                {item.link && (
                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900"
                                                    >
                                                        <LinkIcon className="size-3.5" />
                                                        Open link
                                                    </a>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="py-6 text-center text-sm text-slate-500">
                                    Nothing was posted in this category.
                                </p>
                            )}
                        </div>
                    </section>

                    {categories.length === 0 && (
                        <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm">
                            <FolderOpen className="size-8 text-slate-300" />
                            <p className="mt-2 text-sm text-slate-500">
                                No content categories on this subject.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
