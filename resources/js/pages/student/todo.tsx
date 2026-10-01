import { Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    ListTodo,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type ItemType = 'assignment' | 'quiz';
type Bucket = 'overdue' | 'this_week' | 'next_week' | 'later' | 'no_due_date';

interface TodoItem {
    key: string;
    type: ItemType;
    title: string;
    subject_id: number;
    subject_name: string;
    due_at: string | null;
    posted_at: string;
    completed_at: string | null;
    done: boolean;
    bucket: Bucket | null;
    href: string;
}

interface Subject {
    id: number;
    subject: string;
}

interface TodoProps {
    subjects: Subject[];
    items: TodoItem[];
}

type Tab = 'assigned' | 'missing' | 'done';

const TAB_LABELS: Record<Tab, string> = {
    assigned: 'Assigned',
    missing: 'Missing',
    done: 'Done',
};

const BUCKET_ORDER: Bucket[] = [
    'overdue',
    'this_week',
    'next_week',
    'later',
    'no_due_date',
];

const BUCKET_LABELS: Record<Bucket, string> = {
    overdue: 'Overdue',
    this_week: 'This week',
    next_week: 'Next week',
    later: 'Later',
    no_due_date: 'No due date',
};

const TYPE_META: Record<
    ItemType,
    { icon: typeof ClipboardCheck; iconWrapClass: string }
> = {
    assignment: {
        icon: ClipboardCheck,
        iconWrapClass: 'bg-indigo-50 text-indigo-600',
    },
    quiz: {
        icon: ClipboardList,
        iconWrapClass: 'bg-purple-50 text-purple-600',
    },
};

function formatPosted(iso: string): string {
    return `Posted ${new Intl.DateTimeFormat('en-PH', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    }).format(new Date(iso))}`;
}

function formatDue(iso: string): string {
    return `Due ${new Intl.DateTimeFormat('en-PH', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso))}`;
}

function formatCompleted(iso: string): string {
    return `Completed ${new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(iso))}`;
}

function ItemRow({ item }: { item: TodoItem }) {
    const meta = TYPE_META[item.type];
    const Icon = meta.icon;

    let caption: string;
    if (item.done && item.completed_at) {
        caption = formatCompleted(item.completed_at);
    } else if (item.due_at) {
        caption = formatDue(item.due_at);
    } else {
        caption = formatPosted(item.posted_at);
    }

    return (
        <Link
            href={item.href}
            className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-slate-50"
        >
            <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${meta.iconWrapClass}`}
            >
                <Icon className="size-4" />
            </span>
            <div className="min-w-0">
                <p className="font-semibold text-slate-900 hover:text-red-700">
                    {item.title}
                </p>
                <p className="mt-0.5 text-sm font-medium text-red-600">
                    {item.subject_name}
                </p>
                <p
                    className={`mt-1 text-xs ${
                        !item.done && item.bucket === 'overdue'
                            ? 'font-semibold text-red-600'
                            : 'text-slate-500'
                    }`}
                >
                    {caption}
                </p>
            </div>
            {item.done && (
                <CheckCircle2 className="ml-auto size-4 shrink-0 text-emerald-600" />
            )}
        </Link>
    );
}

function BucketSection({
    bucket,
    items,
    collapsed,
    onToggle,
}: {
    bucket: Bucket;
    items: TodoItem[];
    collapsed: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="border-b border-slate-100 last:border-b-0">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-2 px-5 py-3 text-left hover:bg-slate-50"
            >
                <h3
                    className={`text-sm font-bold ${
                        bucket === 'overdue' && items.length > 0
                            ? 'text-red-700'
                            : 'text-slate-700'
                    }`}
                >
                    {BUCKET_LABELS[bucket]}
                </h3>
                <div className="flex items-center gap-2">
                    <span
                        className={`text-sm font-semibold ${
                            bucket === 'overdue' && items.length > 0
                                ? 'text-red-600'
                                : 'text-slate-400'
                        }`}
                    >
                        {items.length}
                    </span>
                    {collapsed ? (
                        <ChevronRight className="size-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="size-4 text-slate-400" />
                    )}
                </div>
            </button>
            {!collapsed && items.length > 0 && (
                <div className="space-y-0.5 px-2 pb-3">
                    {items.map((item) => (
                        <ItemRow key={item.key} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Todo({ subjects, items }: TodoProps) {
    const [tab, setTab] = useState<Tab>('assigned');
    const [classFilter, setClassFilter] = useState('');
    const [collapsedBuckets, setCollapsedBuckets] = useState<Set<Bucket>>(
        new Set(),
    );

    const toggleBucket = (bucket: Bucket) => {
        setCollapsedBuckets((previous) => {
            const next = new Set(previous);

            if (next.has(bucket)) {
                next.delete(bucket);
            } else {
                next.add(bucket);
            }

            return next;
        });
    };

    const filteredItems = useMemo(
        () =>
            classFilter === ''
                ? items
                : items.filter(
                      (item) => String(item.subject_id) === classFilter,
                  ),
        [items, classFilter],
    );

    const assignedItems = useMemo(
        () => filteredItems.filter((item) => !item.done),
        [filteredItems],
    );

    const bucketedAssigned = useMemo(() => {
        const groups = new Map<Bucket, TodoItem[]>(
            BUCKET_ORDER.map((bucket) => [bucket, []]),
        );

        assignedItems.forEach((item) => {
            if (item.bucket) {
                groups.get(item.bucket)?.push(item);
            }
        });

        return groups;
    }, [assignedItems]);

    const missingItems = useMemo(
        () =>
            assignedItems
                .filter((item) => item.bucket === 'overdue')
                .sort(
                    (a, b) =>
                        new Date(a.due_at ?? 0).getTime() -
                        new Date(b.due_at ?? 0).getTime(),
                ),
        [assignedItems],
    );

    const doneItems = useMemo(
        () =>
            filteredItems
                .filter((item) => item.done)
                .sort(
                    (a, b) =>
                        new Date(b.completed_at ?? 0).getTime() -
                        new Date(a.completed_at ?? 0).getTime(),
                ),
        [filteredItems],
    );

    return (
        <>
            <Head title="To-Do" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[900px] space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <ListTodo className="size-4" />
                            To-Do
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            Your Classwork
                        </h1>
                        <p className="mt-2 text-sm text-red-100">
                            Everything assigned across your subjects, in one
                            place — see what's missing, what's due soon, and
                            what you've already turned in.
                        </p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
                            <div className="flex gap-1">
                                {(
                                    Object.keys(TAB_LABELS) as Tab[]
                                ).map((tabKey) => (
                                    <button
                                        key={tabKey}
                                        type="button"
                                        onClick={() => setTab(tabKey)}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                            tab === tabKey
                                                ? 'bg-red-50 text-red-700'
                                                : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {TAB_LABELS[tabKey]}
                                        {tabKey === 'missing' &&
                                            missingItems.length > 0 && (
                                                <span className="ml-1.5 inline-flex items-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                                                    {missingItems.length}
                                                </span>
                                            )}
                                    </button>
                                ))}
                            </div>

                            <select
                                value={classFilter}
                                onChange={(event) =>
                                    setClassFilter(event.target.value)
                                }
                                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            >
                                <option value="">All classes</option>
                                {subjects.map((subject) => (
                                    <option
                                        key={subject.id}
                                        value={subject.id}
                                    >
                                        {subject.subject}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {tab === 'assigned' &&
                            (assignedItems.length > 0 ? (
                                BUCKET_ORDER.map((bucket) => (
                                    <BucketSection
                                        key={bucket}
                                        bucket={bucket}
                                        items={bucketedAssigned.get(bucket) ?? []}
                                        collapsed={collapsedBuckets.has(
                                            bucket,
                                        )}
                                        onToggle={() => toggleBucket(bucket)}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <CheckCircle2 className="size-10 text-emerald-400" />
                                    <p className="mt-3 font-semibold text-slate-700">
                                        You're all caught up
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Nothing assigned right now.
                                    </p>
                                </div>
                            ))}

                        {tab === 'missing' &&
                            (missingItems.length > 0 ? (
                                <div className="space-y-0.5 px-2 py-3">
                                    {missingItems.map((item) => (
                                        <ItemRow key={item.key} item={item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <CheckCircle2 className="size-10 text-emerald-400" />
                                    <p className="mt-3 font-semibold text-slate-700">
                                        Nothing missing
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        You're not overdue on anything.
                                    </p>
                                </div>
                            ))}

                        {tab === 'done' &&
                            (doneItems.length > 0 ? (
                                <div className="space-y-0.5 px-2 py-3">
                                    {doneItems.map((item) => (
                                        <ItemRow key={item.key} item={item} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <ListTodo className="size-10 text-slate-300" />
                                    <p className="mt-3 font-semibold text-slate-700">
                                        Nothing completed yet
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Work you turn in or attempt will show
                                        up here.
                                    </p>
                                </div>
                            ))}
                    </section>
                </div>
            </div>
        </>
    );
}
