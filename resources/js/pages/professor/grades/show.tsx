import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Download,
    GraduationCap,
    Plus,
    Save,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import BackLink from '@/components/back-link';

type Term = 'prelims' | 'midterm' | 'finals';

const TERM_LABELS: Record<Term, string> = {
    prelims: 'Prelims',
    midterm: 'Midterm',
    finals: 'Finals',
};

const FOLD_CONFIG: Partial<
    Record<
        Term,
        {
            fold: 'midterm' | 'finals';
            previousLabel: string;
            periodLabel: string;
            previousKey: 'prelims_weight' | 'midterm_weight';
            periodKey: 'midterm_period_weight' | 'finals_weight';
        }
    >
> = {
    midterm: {
        fold: 'midterm',
        previousLabel: 'Prelims Grade',
        periodLabel: 'Midterm Period',
        previousKey: 'prelims_weight',
        periodKey: 'midterm_period_weight',
    },
    finals: {
        fold: 'finals',
        previousLabel: 'Midterm Grade',
        periodLabel: 'Finals Period',
        previousKey: 'midterm_weight',
        periodKey: 'finals_weight',
    },
};

interface Courseware {
    id: number;
    subject: string;
    course_code: string | null;
}

interface CategoryItem {
    id: number;
    title: string;
    key: string;
    max_points: number | null;
}

interface Category {
    id: number;
    name: string;
    weight: number;
    is_quizzes: boolean;
    is_manual: boolean;
    is_attendance: boolean;
    items: CategoryItem[];
}

interface GradeRow {
    student_id: number;
    name: string;
    student_number: string | null;
    item_scores: Record<string, number | null>;
    item_displays: Record<string, string | null>;
    category_averages: Record<number, number | null>;
    term_grade: number | null;
    cumulative_grade: number | null;
    prelims_grade?: number | null;
    midterm_grade?: number | null;
}

interface GradesProps {
    courseware: Courseware;
    term: Term;
    termWeights: {
        prelims_weight: number;
        midterm_period_weight: number;
        midterm_weight: number;
        finals_weight: number;
    };
    categories: Category[];
    rows: GradeRow[];
}

interface PageProps {
    errors: Record<string, string>;
    [key: string]: unknown;
}

function scoreKey(itemKey: string, studentId: number): string {
    return `${itemKey}|${studentId}`;
}

function formatScore(score: number | null): string {
    return score === null ? '—' : `${score}%`;
}

export default function Grades({
    courseware,
    term,
    termWeights,
    categories,
    rows,
}: GradesProps) {
    const { errors } = usePage<PageProps>().props;

    const items = useMemo(
        () => categories.flatMap((category) => category.items),
        [categories],
    );

    // Category weights
    const [weights, setWeights] = useState<Record<number, string>>(() =>
        Object.fromEntries(
            categories.map((category) => [
                category.id,
                String(category.weight),
            ]),
        ),
    );
    const [weightsProcessing, setWeightsProcessing] = useState(false);

    const weightTotal = useMemo(
        () =>
            Math.round(
                Object.values(weights).reduce(
                    (sum, value) => sum + (Number(value) || 0),
                    0,
                ) * 100,
            ) / 100,
        [weights],
    );
    const isValidWeightTotal =
        categories.length === 0 || Math.abs(weightTotal - 100) < 0.01;

    // The combined total can never usefully exceed 100%, so typing a value
    // that would push it over is clamped down to whatever's actually left
    // instead of just flagging it red after the fact.
    const remainingWeightFor = (categoryId: number) => {
        const othersSum = Object.entries(weights)
            .filter(([id]) => Number(id) !== categoryId)
            .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);

        return Math.max(0, Math.round((100 - othersSum) * 100) / 100);
    };

    const updateWeight = (categoryId: number, rawValue: string) => {
        const numValue = Number(rawValue);
        const value =
            rawValue === '' || Number.isNaN(numValue)
                ? rawValue
                : String(Math.min(numValue, remainingWeightFor(categoryId)));

        setWeights((prev) => ({ ...prev, [categoryId]: value }));
    };

    const saveWeights = () => {
        setWeightsProcessing(true);
        router.put(
            `/professor/courses/${courseware.id}/grades/${term}/categories`,
            {
                categories: categories.map((category) => ({
                    id: category.id,
                    weight: Number(weights[category.id]) || 0,
                })),
            },
            {
                preserveScroll: true,
                onFinish: () => setWeightsProcessing(false),
            },
        );
    };

    // Term composition — how much the previous cumulative grade and this
    // period's own work each contribute. Not relevant on the Prelims tab
    // since Prelims has no previous period to fold in.
    const foldConfig = FOLD_CONFIG[term];
    const [termSplit, setTermSplit] = useState({
        previous: String(foldConfig ? termWeights[foldConfig.previousKey] : 0),
        period: String(foldConfig ? termWeights[foldConfig.periodKey] : 0),
    });
    const [termSplitProcessing, setTermSplitProcessing] = useState(false);
    const termSplitTotal =
        Math.round(
            ((Number(termSplit.previous) || 0) +
                (Number(termSplit.period) || 0)) *
                100,
        ) / 100;
    const isValidTermSplit = Math.abs(termSplitTotal - 100) < 0.01;

    const remainingSplitFor = (which: 'previous' | 'period') => {
        const other =
            which === 'previous' ? termSplit.period : termSplit.previous;

        return Math.max(
            0,
            Math.round((100 - (Number(other) || 0)) * 100) / 100,
        );
    };

    const updateTermSplit = (
        which: 'previous' | 'period',
        rawValue: string,
    ) => {
        const numValue = Number(rawValue);
        const value =
            rawValue === '' || Number.isNaN(numValue)
                ? rawValue
                : String(Math.min(numValue, remainingSplitFor(which)));

        setTermSplit((prev) => ({ ...prev, [which]: value }));
    };

    const saveTermSplit = () => {
        if (!foldConfig) {
            return;
        }

        setTermSplitProcessing(true);
        router.put(
            `/professor/courses/${courseware.id}/grades/term-weights`,
            {
                fold: foldConfig.fold,
                previous_weight: Number(termSplit.previous) || 0,
                period_weight: Number(termSplit.period) || 0,
            },
            {
                preserveScroll: true,
                onFinish: () => setTermSplitProcessing(false),
            },
        );
    };

    // Scores
    const initialScores = useMemo(() => {
        const entries: Record<string, string> = {};
        rows.forEach((row) => {
            items.forEach((item) => {
                const value = row.item_scores[item.key];
                entries[scoreKey(item.key, row.student_id)] =
                    value === null || value === undefined ? '' : String(value);
            });
        });

        return entries;
    }, [rows, items]);

    const [scores, setScores] = useState<Record<string, string>>(
        () => initialScores,
    );
    const [scoresProcessing, setScoresProcessing] = useState(false);

    const updateScore = (key: string, rawValue: string, maxPoints: number) => {
        const numValue = Number(rawValue);
        const value =
            rawValue === '' || Number.isNaN(numValue)
                ? rawValue
                : String(
                      Math.min(maxPoints, Math.max(0, Math.round(numValue))),
                  );

        setScores((prev) => ({ ...prev, [key]: value }));
    };

    const scoresChanged = Object.keys(scores).some(
        (key) => scores[key] !== initialScores[key],
    );

    const saveScores = () => {
        // Quiz scores are read-only (never editable here), so only "item-"
        // keys (manual grade items, including auto-synced Assignments and
        // Activities) can ever actually differ from their initial value.
        const changed = rows.flatMap((row) =>
            items
                .filter((item) => item.key.startsWith('item-'))
                .map((item) => {
                    const key = scoreKey(item.key, row.student_id);

                    if (scores[key] === initialScores[key]) {
                        return null;
                    }

                    const [, rawId] = item.key.split('-');

                    return {
                        student_id: row.student_id,
                        id: Number(rawId),
                        score: scores[key] === '' ? null : Number(scores[key]),
                    };
                })
                .filter((entry) => entry !== null),
        );

        if (changed.length === 0) {
            return;
        }

        setScoresProcessing(true);
        router.put(
            `/professor/courses/${courseware.id}/grades/${term}/scores`,
            { scores: changed },
            {
                preserveScroll: true,
                onFinish: () => setScoresProcessing(false),
            },
        );
    };

    // Add / remove manual items
    const [newItemTitles, setNewItemTitles] = useState<Record<number, string>>(
        {},
    );
    const [newItemMaxPoints, setNewItemMaxPoints] = useState<
        Record<number, string>
    >({});

    const addItem = (event: FormEvent<HTMLFormElement>, categoryId: number) => {
        event.preventDefault();
        const title = newItemTitles[categoryId]?.trim();

        if (!title) {
            return;
        }

        router.post(
            `/professor/courses/${courseware.id}/grades/categories/${categoryId}/items`,
            {
                title,
                max_points: newItemMaxPoints[categoryId] || 100,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewItemTitles((prev) => ({ ...prev, [categoryId]: '' }));
                    setNewItemMaxPoints((prev) => ({
                        ...prev,
                        [categoryId]: '',
                    }));
                },
            },
        );
    };

    const removeItem = (itemId: number) => {
        router.delete(
            `/professor/courses/${courseware.id}/grades/items/${itemId}`,
            {
                preserveScroll: true,
            },
        );
    };

    // Category columns start collapsed to a single "Average" column — with
    // several categories each holding several items, showing every item's
    // column at once made the table overflow and get cramped. Clicking a
    // category header expands it to show its individual item columns.
    const [expandedCategories, setExpandedCategories] = useState<
        Record<number, boolean>
    >({});

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    return (
        <>
            <Head
                title={`${TERM_LABELS[term]} Grades — ${courseware.subject}`}
            />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1600px] space-y-6">
                    <BackLink href="/professor/grades">
                        Back to subjects
                    </BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <GraduationCap className="size-4" />
                                    Grading System
                                </div>
                                <h1 className="mt-2 text-2xl font-bold">
                                    {courseware.subject}
                                    {courseware.course_code
                                        ? ` (${courseware.course_code})`
                                        : ''}
                                </h1>
                                <p className="mt-2 text-sm text-red-100">
                                    Grades cascade cumulatively: Midterm
                                    includes Prelims, and Finals includes
                                    Midterm.
                                </p>
                            </div>

                            <a
                                href={`/professor/courses/${courseware.id}/grades/${term}/export`}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                                <Download className="size-4" />
                                Export to CSV
                            </a>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <Link
                                href={`/professor/courses/${courseware.id}/grades/prelims`}
                                replace
                                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                    term === 'prelims'
                                        ? 'bg-white text-red-700'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Prelims
                            </Link>
                            <Link
                                href={`/professor/courses/${courseware.id}/grades/midterm`}
                                replace
                                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                    term === 'midterm'
                                        ? 'bg-white text-red-700'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Midterm
                            </Link>
                            <Link
                                href={`/professor/courses/${courseware.id}/grades/finals`}
                                replace
                                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                    term === 'finals'
                                        ? 'bg-white text-red-700'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Finals
                            </Link>
                        </div>
                    </section>

                    {foldConfig && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h2 className="font-semibold text-slate-900">
                                    Term Composition
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    How much the {foldConfig.previousLabel} and
                                    the {foldConfig.periodLabel} each contribute
                                    to the cumulative {TERM_LABELS[term]} Grade
                                    — must always add up to 100%.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-end gap-4 p-5">
                                <div className="grid w-40 gap-1.5">
                                    <label
                                        htmlFor="previous-weight"
                                        className="text-xs font-medium text-slate-600"
                                    >
                                        {foldConfig.previousLabel}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="previous-weight"
                                            type="number"
                                            min={0}
                                            max={remainingSplitFor('previous')}
                                            step="0.5"
                                            value={termSplit.previous}
                                            onChange={(event) =>
                                                updateTermSplit(
                                                    'previous',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-7 pl-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">
                                            %
                                        </span>
                                    </div>
                                </div>
                                <div className="grid w-40 gap-1.5">
                                    <label
                                        htmlFor="period-weight"
                                        className="text-xs font-medium text-slate-600"
                                    >
                                        {foldConfig.periodLabel}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="period-weight"
                                            type="number"
                                            min={0}
                                            max={remainingSplitFor('period')}
                                            step="0.5"
                                            value={termSplit.period}
                                            onChange={(event) =>
                                                updateTermSplit(
                                                    'period',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-7 pl-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">
                                            %
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-auto flex flex-col items-end gap-2">
                                    <span
                                        className={`text-sm font-semibold ${
                                            isValidTermSplit
                                                ? 'text-emerald-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        Total: {termSplitTotal}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={saveTermSplit}
                                        disabled={
                                            !isValidTermSplit ||
                                            termSplitProcessing
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Save className="size-4" />
                                        {termSplitProcessing
                                            ? 'Saving...'
                                            : 'Save Composition'}
                                    </button>
                                </div>
                            </div>
                            {errors.term_weights && (
                                <p className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
                                    <AlertTriangle className="size-4 shrink-0" />
                                    {errors.term_weights}
                                </p>
                            )}
                        </section>
                    )}

                    {categories.length > 0 && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-4">
                                <h2 className="font-semibold text-slate-900">
                                    Category Weights
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    How much each category counts toward the{' '}
                                    {TERM_LABELS[term]}{' '}
                                    {term === 'prelims'
                                        ? 'Grade'
                                        : 'period grade'}{' '}
                                    — must always add up to 100%.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-end gap-4 p-5">
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="grid w-36 gap-1.5"
                                    >
                                        <label
                                            htmlFor={`cat-weight-${category.id}`}
                                            className="truncate text-xs font-medium text-slate-600"
                                            title={category.name}
                                        >
                                            {category.name}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id={`cat-weight-${category.id}`}
                                                type="number"
                                                min={0}
                                                max={remainingWeightFor(
                                                    category.id,
                                                )}
                                                step="0.5"
                                                value={
                                                    weights[category.id] ?? ''
                                                }
                                                onChange={(event) =>
                                                    updateWeight(
                                                        category.id,
                                                        event.target.value,
                                                    )
                                                }
                                                className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-7 pl-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                            />
                                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-slate-400">
                                                %
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                <div className="ml-auto flex flex-col items-end gap-2">
                                    <span
                                        className={`text-sm font-semibold ${
                                            isValidWeightTotal
                                                ? 'text-emerald-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        Total: {weightTotal}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={saveWeights}
                                        disabled={
                                            !isValidWeightTotal ||
                                            weightsProcessing
                                        }
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Save className="size-4" />
                                        {weightsProcessing
                                            ? 'Saving...'
                                            : 'Save Weights'}
                                    </button>
                                </div>
                            </div>

                            {!isValidWeightTotal && (
                                <p className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
                                    <AlertTriangle className="size-4 shrink-0" />
                                    Weights must add up to exactly 100% before
                                    they can be saved.
                                </p>
                            )}

                            {errors.categories && (
                                <p className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
                                    <AlertTriangle className="size-4 shrink-0" />
                                    {errors.categories}
                                </p>
                            )}

                            <div className="border-t border-slate-200 p-5">
                                <p className="text-xs text-slate-500">
                                    Quiz items are managed from the{' '}
                                    <Link
                                        href="/professor/quizzes"
                                        className="font-semibold text-red-700 hover:underline"
                                    >
                                        Quizzes
                                    </Link>{' '}
                                    page. Assignment and Activity items are
                                    added automatically when a student submits
                                    graded work for a module tagged as that
                                    type. Expand a Recitation or Prelim Exam
                                    column in the table below to add its items.
                                </p>
                            </div>
                        </section>
                    )}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Student Grades
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Type a score directly into a cell to enter
                                    or override it, then save.
                                </p>
                            </div>

                            {rows.length > 0 && items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={saveScores}
                                    disabled={
                                        !scoresChanged || scoresProcessing
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Save className="size-4" />
                                    {scoresProcessing
                                        ? 'Saving...'
                                        : 'Save Grades'}
                                </button>
                            )}
                        </div>

                        {Object.keys(errors).some((key) =>
                            key.startsWith('scores'),
                        ) && (
                            <p className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
                                <AlertTriangle className="size-4 shrink-0" />
                                Some scores could not be saved. Scores must be
                                between 0 and 100.
                            </p>
                        )}

                        {rows.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] text-left">
                                    <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                        <tr>
                                            <th
                                                rowSpan={2}
                                                className="px-5 py-3 align-bottom font-semibold"
                                            >
                                                Student
                                            </th>
                                            {categories.map((category) => {
                                                const isExpanded =
                                                    expandedCategories[
                                                        category.id
                                                    ] ?? false;

                                                return (
                                                    <th
                                                        key={category.id}
                                                        colSpan={
                                                            isExpanded
                                                                ? Math.max(
                                                                      category
                                                                          .items
                                                                          .length,
                                                                      1,
                                                                  ) +
                                                                  (category.is_manual
                                                                      ? 1
                                                                      : 0)
                                                                : 1
                                                        }
                                                        className="border-l border-slate-200 px-5 py-2 text-center font-semibold"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleCategory(
                                                                    category.id,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 hover:text-red-700"
                                                            title={
                                                                isExpanded
                                                                    ? 'Collapse to show only the category average'
                                                                    : 'Expand to show individual items'
                                                            }
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="size-3.5 shrink-0" />
                                                            ) : (
                                                                <ChevronRight className="size-3.5 shrink-0" />
                                                            )}
                                                            {category.name} (
                                                            {category.weight}%)
                                                        </button>
                                                    </th>
                                                );
                                            })}
                                            <th
                                                rowSpan={2}
                                                className={`border-l border-slate-200 px-5 py-3 align-bottom font-semibold ${
                                                    term === 'prelims'
                                                        ? 'text-red-700'
                                                        : ''
                                                }`}
                                            >
                                                {term === 'prelims'
                                                    ? 'Prelims Grade'
                                                    : foldConfig?.periodLabel}
                                            </th>
                                            {foldConfig && (
                                                <>
                                                    <th
                                                        rowSpan={2}
                                                        className="border-l border-slate-200 px-5 py-3 align-bottom font-semibold"
                                                    >
                                                        {
                                                            foldConfig.previousLabel
                                                        }
                                                    </th>
                                                    <th
                                                        rowSpan={2}
                                                        className="border-l border-slate-200 px-5 py-3 align-bottom font-semibold text-red-700"
                                                    >
                                                        {TERM_LABELS[term]}{' '}
                                                        Grade
                                                    </th>
                                                </>
                                            )}
                                        </tr>
                                        <tr>
                                            {categories.map((category) => {
                                                const isExpanded =
                                                    expandedCategories[
                                                        category.id
                                                    ] ?? false;

                                                if (!isExpanded) {
                                                    return (
                                                        <th
                                                            key={`${category.id}-avg`}
                                                            className="border-l border-slate-100 px-3 py-2 text-center font-medium text-slate-500 normal-case"
                                                        >
                                                            Average
                                                        </th>
                                                    );
                                                }

                                                const itemHeaders =
                                                    category.items.length > 0
                                                        ? category.items.map(
                                                              (item) => (
                                                                  <th
                                                                      key={
                                                                          item.key
                                                                      }
                                                                      className="border-l border-slate-100 px-3 py-2 text-center font-medium normal-case"
                                                                  >
                                                                      <div className="flex items-center justify-center gap-1">
                                                                          <span className="truncate">
                                                                              {
                                                                                  item.title
                                                                              }
                                                                          </span>
                                                                          {category.is_manual && (
                                                                              <button
                                                                                  type="button"
                                                                                  onClick={() =>
                                                                                      removeItem(
                                                                                          item.id,
                                                                                      )
                                                                                  }
                                                                                  className="text-slate-400 hover:text-red-600"
                                                                              >
                                                                                  <X className="size-3" />
                                                                              </button>
                                                                          )}
                                                                      </div>
                                                                  </th>
                                                              ),
                                                          )
                                                        : [
                                                              <th
                                                                  key={`${category.id}-empty`}
                                                                  className="border-l border-slate-100 px-3 py-2 text-center font-medium text-slate-400 normal-case"
                                                              >
                                                                  No items
                                                              </th>,
                                                          ];

                                                if (!category.is_manual) {
                                                    return itemHeaders;
                                                }

                                                return [
                                                    ...itemHeaders,
                                                    <th
                                                        key={`${category.id}-add`}
                                                        className="border-l border-slate-100 px-2 py-2 text-center normal-case"
                                                    >
                                                        <form
                                                            onSubmit={(event) =>
                                                                addItem(
                                                                    event,
                                                                    category.id,
                                                                )
                                                            }
                                                            className="flex items-center justify-center gap-1"
                                                        >
                                                            <input
                                                                type="text"
                                                                value={
                                                                    newItemTitles[
                                                                        category
                                                                            .id
                                                                    ] ?? ''
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setNewItemTitles(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [category.id]:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                                placeholder="New item…"
                                                                className="h-7 w-24 rounded-md border border-slate-300 bg-white px-2 text-xs font-normal outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
                                                            />
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={
                                                                    newItemMaxPoints[
                                                                        category
                                                                            .id
                                                                    ] ?? ''
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setNewItemMaxPoints(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [category.id]:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                                placeholder="Pts"
                                                                title="Total points (defaults to 100)"
                                                                className="h-7 w-14 rounded-md border border-slate-300 bg-white px-1.5 text-xs font-normal outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
                                                            />
                                                            <button
                                                                type="submit"
                                                                title="Add item"
                                                                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
                                                            >
                                                                <Plus className="size-3.5" />
                                                            </button>
                                                        </form>
                                                    </th>,
                                                ];
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rows.map((row) => (
                                            <tr
                                                key={row.student_id}
                                                className="hover:bg-red-50/40"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-slate-900">
                                                        {row.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {row.student_number ??
                                                            '—'}
                                                    </p>
                                                </td>
                                                {categories.map((category) => {
                                                    const isExpanded =
                                                        expandedCategories[
                                                            category.id
                                                        ] ?? false;

                                                    if (!isExpanded) {
                                                        return (
                                                            <td
                                                                key={`${category.id}-avg-${row.student_id}`}
                                                                className="border-l border-slate-100 px-5 py-3 text-center text-sm text-slate-600"
                                                            >
                                                                {formatScore(
                                                                    row
                                                                        .category_averages[
                                                                        category
                                                                            .id
                                                                    ] ?? null,
                                                                )}
                                                            </td>
                                                        );
                                                    }

                                                    if (
                                                        category.is_attendance
                                                    ) {
                                                        return category.items.map(
                                                            (item) => (
                                                                <td
                                                                    key={scoreKey(
                                                                        item.key,
                                                                        row.student_id,
                                                                    )}
                                                                    className="border-l border-slate-100 px-3 py-3 text-center text-sm text-slate-600"
                                                                >
                                                                    {row
                                                                        .item_displays[
                                                                        item.key
                                                                    ] ?? '—'}
                                                                </td>
                                                            ),
                                                        );
                                                    }

                                                    // Quiz scores are always
                                                    // the actual attempt
                                                    // result — read-only,
                                                    // never a manual override.
                                                    if (category.is_quizzes) {
                                                        return category.items
                                                            .length > 0
                                                            ? category.items.map(
                                                                  (item) => (
                                                                      <td
                                                                          key={scoreKey(
                                                                              item.key,
                                                                              row.student_id,
                                                                          )}
                                                                          className="border-l border-slate-100 px-3 py-3 text-center text-sm text-slate-600"
                                                                      >
                                                                          {row
                                                                              .item_displays[
                                                                              item
                                                                                  .key
                                                                          ] ??
                                                                              '—'}
                                                                      </td>
                                                                  ),
                                                              )
                                                            : [
                                                                  <td
                                                                      key={`${category.id}-empty-${row.student_id}`}
                                                                      className="border-l border-slate-100 px-3 py-3 text-center text-sm text-slate-300"
                                                                  >
                                                                      —
                                                                  </td>,
                                                              ];
                                                    }

                                                    const itemCells =
                                                        category.items.length >
                                                        0
                                                            ? category.items.map(
                                                                  (item) => {
                                                                      const key =
                                                                          scoreKey(
                                                                              item.key,
                                                                              row.student_id,
                                                                          );
                                                                      const maxPoints =
                                                                          item.max_points ??
                                                                          100;

                                                                      return (
                                                                          <td
                                                                              key={
                                                                                  key
                                                                              }
                                                                              className="border-l border-slate-100 px-3 py-3"
                                                                          >
                                                                              <div className="relative mx-auto w-20">
                                                                                  <input
                                                                                      type="number"
                                                                                      min={
                                                                                          0
                                                                                      }
                                                                                      max={
                                                                                          maxPoints
                                                                                      }
                                                                                      step="1"
                                                                                      placeholder="—"
                                                                                      value={
                                                                                          scores[
                                                                                              key
                                                                                          ] ??
                                                                                          ''
                                                                                      }
                                                                                      onChange={(
                                                                                          event,
                                                                                      ) =>
                                                                                          updateScore(
                                                                                              key,
                                                                                              event
                                                                                                  .target
                                                                                                  .value,
                                                                                              maxPoints,
                                                                                          )
                                                                                      }
                                                                                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-center text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                                                                  />
                                                                              </div>
                                                                              {row
                                                                                  .item_displays[
                                                                                  item
                                                                                      .key
                                                                              ] && (
                                                                                  <p className="mt-1 text-center text-[11px] text-slate-400">
                                                                                      {
                                                                                          row
                                                                                              .item_displays[
                                                                                              item
                                                                                                  .key
                                                                                          ]
                                                                                      }
                                                                                  </p>
                                                                              )}
                                                                          </td>
                                                                      );
                                                                  },
                                                              )
                                                            : [
                                                                  <td
                                                                      key={`${category.id}-empty-${row.student_id}`}
                                                                      className="border-l border-slate-100 px-3 py-3 text-center text-sm text-slate-300"
                                                                  >
                                                                      —
                                                                  </td>,
                                                              ];

                                                    if (!category.is_manual) {
                                                        return itemCells;
                                                    }

                                                    return [
                                                        ...itemCells,
                                                        <td
                                                            key={`${category.id}-add-${row.student_id}`}
                                                            className="border-l border-slate-100 px-3 py-3"
                                                        />,
                                                    ];
                                                })}
                                                <td
                                                    className={`border-l border-slate-100 px-5 py-4 text-sm font-semibold ${
                                                        term === 'prelims'
                                                            ? 'font-bold text-red-700'
                                                            : 'text-slate-900'
                                                    }`}
                                                >
                                                    {formatScore(
                                                        row.term_grade,
                                                    )}
                                                </td>
                                                {term === 'midterm' && (
                                                    <>
                                                        <td className="border-l border-slate-100 px-5 py-4 text-sm text-slate-600">
                                                            {formatScore(
                                                                row.prelims_grade ??
                                                                    null,
                                                            )}
                                                        </td>
                                                        <td className="border-l border-slate-100 px-5 py-4 text-sm font-bold text-red-700">
                                                            {formatScore(
                                                                row.cumulative_grade,
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                                {term === 'finals' && (
                                                    <>
                                                        <td className="border-l border-slate-100 px-5 py-4 text-sm text-slate-600">
                                                            {formatScore(
                                                                row.midterm_grade ??
                                                                    null,
                                                            )}
                                                        </td>
                                                        <td className="border-l border-slate-100 px-5 py-4 text-sm font-bold text-red-700">
                                                            {formatScore(
                                                                row.cumulative_grade,
                                                            )}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex min-h-56 flex-col items-center justify-center text-center">
                                <GraduationCap className="size-10 text-slate-300" />
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
        </>
    );
}
