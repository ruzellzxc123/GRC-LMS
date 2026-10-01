import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    GraduationCap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import BackLink from '@/components/back-link';
import { useCourseUpdates } from '@/hooks/use-live-updates';

type Term = 'prelims' | 'midterm' | 'finals';

const TERM_LABELS: Record<Term, string> = {
    prelims: 'Prelims',
    midterm: 'Midterm',
    finals: 'Finals',
};

// Which extra "what fed into this" columns appear next to the term's own
// grade, once a later term is being viewed — Prelims and Midterm each carry
// a direct, independent share of the Overall Grade, so Finals shows both of
// them rather than just one folded-together number.
const CONTRIBUTING_TERMS: Partial<Record<Term, Term[]>> = {
    midterm: ['prelims'],
    finals: ['prelims', 'midterm'],
};

interface Courseware {
    id: number;
    subject: string;
}

interface CategoryItem {
    key: string;
    title: string;
    kind: 'quiz' | 'attendance' | 'item';
    score: number | null;
    display: string | null;
}

interface Category {
    id: number;
    name: string;
    weight: number;
    average: number | null;
    items: CategoryItem[];
}

interface GradesShowProps {
    courseware: Courseware;
    term: Term;
    categories: Category[];
    term_grade: number | null;
    cumulative_grade: number | null;
    prelims_grade: number | null;
    midterm_grade: number | null;
}

function formatGrade(grade: number | null): string {
    return grade === null ? '—' : `${Math.round(grade)}%`;
}

function missingLabel(item: CategoryItem): string {
    if (item.kind === 'quiz') {
        return 'Not attempted';
    }

    if (item.kind === 'attendance') {
        return 'Not recorded';
    }

    return 'Not graded';
}

export default function GradesShow({
    courseware,
    term,
    categories,
    term_grade,
    cumulative_grade,
    prelims_grade,
    midterm_grade,
}: GradesShowProps) {
    useCourseUpdates(courseware.id);

    const [expandedCategories, setExpandedCategories] = useState<
        Record<number, boolean>
    >({});

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    const missingItems = useMemo(
        () =>
            categories.flatMap((category) =>
                category.items
                    .filter((item) => item.score === null)
                    .map((item) => ({
                        category: category.name,
                        title: item.title,
                        label: missingLabel(item),
                        urgent: item.kind === 'quiz',
                    })),
            ),
        [categories],
    );

    const contributingTerms = CONTRIBUTING_TERMS[term];
    const contributingGrades: Record<Term, number | null> = {
        prelims: prelims_grade,
        midterm: midterm_grade,
        finals: null,
    };

    return (
        <>
            <Head
                title={`${TERM_LABELS[term]} Grade — ${courseware.subject}`}
            />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-[1300px] space-y-6">
                    <BackLink href="/student/grades">Back to subjects</BackLink>

                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-red-100">
                                    <GraduationCap className="size-4" />
                                    Grading System (View Only)
                                </div>
                                <h1 className="mt-2 text-2xl font-bold">
                                    {courseware.subject}
                                </h1>
                                <p className="mt-2 text-sm text-red-100">
                                    Prelims, Midterm, and Finals each carry a
                                    direct share of the Overall Grade — always
                                    adding up to 100%.
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/10 px-5 py-4 text-center">
                                <p className="text-xs font-medium tracking-wide text-red-100 uppercase">
                                    Overall Grade
                                </p>
                                <p className="mt-1 text-3xl font-bold">
                                    {formatGrade(cumulative_grade)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                            {(Object.keys(TERM_LABELS) as Term[]).map(
                                (value) => (
                                    <Link
                                        key={value}
                                        href={`/student/courses/${courseware.id}/grades/${value}`}
                                        replace
                                        className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                                            term === value
                                                ? 'bg-white text-red-700'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    >
                                        {TERM_LABELS[value]}
                                    </Link>
                                ),
                            )}
                        </div>
                    </section>

                    {missingItems.length > 0 && (
                        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-amber-800">
                                <AlertTriangle className="size-4" />
                                <h2 className="font-semibold">
                                    {missingItems.length} item
                                    {missingItems.length === 1 ? '' : 's'} still
                                    missing for {TERM_LABELS[term]}
                                </h2>
                            </div>
                            <ul className="mt-3 space-y-1.5 text-sm text-amber-800">
                                {missingItems.map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <span>
                                            <span className="font-medium">
                                                {item.category}
                                            </span>
                                            {' — '}
                                            {item.title}
                                        </span>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                item.urgent
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}
                                        >
                                            {item.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="font-semibold text-slate-900">
                                {TERM_LABELS[term]} Grade Breakdown
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Click a category to see the individual items
                                behind its average.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                                    <tr>
                                        <th
                                            rowSpan={2}
                                            className="px-5 py-3 align-bottom font-semibold"
                                        >
                                            {TERM_LABELS[term]}
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
                                                                  category.items
                                                                      .length,
                                                                  1,
                                                              )
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
                                            {TERM_LABELS[term]} Grade
                                        </th>
                                        {contributingTerms && (
                                            <>
                                                {contributingTerms.map(
                                                    (contributingTerm) => (
                                                        <th
                                                            key={
                                                                contributingTerm
                                                            }
                                                            rowSpan={2}
                                                            className="border-l border-slate-200 px-5 py-3 align-bottom font-semibold"
                                                        >
                                                            {
                                                                TERM_LABELS[
                                                                    contributingTerm
                                                                ]
                                                            }{' '}
                                                            Grade
                                                        </th>
                                                    ),
                                                )}
                                                <th
                                                    rowSpan={2}
                                                    className="border-l border-slate-200 px-5 py-3 align-bottom font-semibold text-red-700"
                                                >
                                                    Overall Grade
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

                                            return category.items.length > 0 ? (
                                                category.items.map((item) => (
                                                    <th
                                                        key={item.key}
                                                        className="border-l border-slate-100 px-3 py-2 text-center font-medium normal-case"
                                                    >
                                                        <span className="truncate">
                                                            {item.title}
                                                        </span>
                                                    </th>
                                                ))
                                            ) : (
                                                <th
                                                    key={`${category.id}-empty`}
                                                    className="border-l border-slate-100 px-3 py-2 text-center font-medium text-slate-400 normal-case"
                                                >
                                                    No items
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-red-50/40">
                                        <td className="px-5 py-4 font-medium text-slate-900">
                                            You
                                        </td>
                                        {categories.map((category) => {
                                            const isExpanded =
                                                expandedCategories[
                                                    category.id
                                                ] ?? false;

                                            if (!isExpanded) {
                                                return (
                                                    <td
                                                        key={`${category.id}-avg-you`}
                                                        className="border-l border-slate-100 px-5 py-3 text-center text-sm text-slate-600"
                                                    >
                                                        {formatGrade(
                                                            category.average,
                                                        )}
                                                    </td>
                                                );
                                            }

                                            return category.items.length > 0 ? (
                                                category.items.map((item) => (
                                                    <td
                                                        key={item.key}
                                                        className="border-l border-slate-100 px-3 py-3 text-center text-sm"
                                                    >
                                                        {item.score === null ? (
                                                            <span
                                                                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
                                                                title={missingLabel(
                                                                    item,
                                                                )}
                                                            >
                                                                <AlertTriangle className="size-3" />
                                                                {missingLabel(
                                                                    item,
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-600">
                                                                {item.display} ·{' '}
                                                                {formatGrade(
                                                                    item.score,
                                                                )}
                                                            </span>
                                                        )}
                                                    </td>
                                                ))
                                            ) : (
                                                <td
                                                    key={`${category.id}-empty-you`}
                                                    className="border-l border-slate-100 px-3 py-3 text-center text-sm text-slate-300"
                                                >
                                                    —
                                                </td>
                                            );
                                        })}
                                        <td className="border-l border-slate-100 px-5 py-4 text-center font-semibold text-slate-900">
                                            {formatGrade(term_grade)}
                                        </td>
                                        {contributingTerms && (
                                            <>
                                                {contributingTerms.map(
                                                    (contributingTerm) => (
                                                        <td
                                                            key={
                                                                contributingTerm
                                                            }
                                                            className="border-l border-slate-100 px-5 py-4 text-center text-slate-600"
                                                        >
                                                            {formatGrade(
                                                                contributingGrades[
                                                                    contributingTerm
                                                                ],
                                                            )}
                                                        </td>
                                                    ),
                                                )}
                                                <td className="border-l border-slate-100 px-5 py-4 text-center text-lg font-bold text-red-700">
                                                    {formatGrade(
                                                        cumulative_grade,
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
