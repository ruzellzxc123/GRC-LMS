import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Megaphone,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { useAnnouncementUpdates } from '@/hooks/use-live-updates';
import type { Auth } from '@/types/auth';

interface AcademicTermData {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    prelims_start: string | null;
    prelims_end: string | null;
    midterm_start: string | null;
    midterm_end: string | null;
    finals_start: string | null;
    finals_end: string | null;
}

interface PendingDeadline {
    id: number;
    title: string;
    subject: string;
    date: string;
    deadline: string;
}

interface ClassSchedule {
    id: number;
    subject: string;
    class_day: string;
    class_start_time: string | null;
    class_end_time: string | null;
}

interface Announcement {
    id: number;
    date: string;
    title: string;
    description: string | null;
}

interface CalendarPageProps {
    terms: AcademicTermData[];
    pending_deadlines: PendingDeadline[];
    my_classes: ClassSchedule[];
    announcements: Announcement[];
}

interface PageProps {
    auth?: Auth;
    errors: Record<string, string>;
    [key: string]: unknown;
}

type PeriodKind = 'prelims' | 'midterm' | 'finals';

interface Period {
    kind: PeriodKind;
    termName: string;
    start: string;
    end: string;
}

const PERIOD_LABELS: Record<PeriodKind, string> = {
    prelims: 'Prelims',
    midterm: 'Midterm',
    finals: 'Finals',
};

const PERIOD_STYLES: Record<
    PeriodKind,
    { bg: string; dot: string; text: string }
> = {
    prelims: {
        bg: 'bg-amber-100',
        dot: 'bg-amber-500',
        text: 'text-amber-900',
    },
    midterm: { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-900' },
    finals: { bg: 'bg-red-100', dot: 'bg-red-600', text: 'text-red-900' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FULL_WEEKDAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

function toKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

function buildPeriods(terms: AcademicTermData[]): Period[] {
    const periods: Period[] = [];

    for (const term of terms) {
        if (term.prelims_start && term.prelims_end) {
            periods.push({
                kind: 'prelims',
                termName: term.name,
                start: term.prelims_start,
                end: term.prelims_end,
            });
        }

        if (term.midterm_start && term.midterm_end) {
            periods.push({
                kind: 'midterm',
                termName: term.name,
                start: term.midterm_start,
                end: term.midterm_end,
            });
        }

        if (term.finals_start && term.finals_end) {
            periods.push({
                kind: 'finals',
                termName: term.name,
                start: term.finals_start,
                end: term.finals_end,
            });
        }
    }

    return periods.sort((a, b) => a.start.localeCompare(b.start));
}

function findTermForDate(
    dateKey: string,
    terms: AcademicTermData[],
): AcademicTermData | null {
    return (
        terms.find(
            (term) => dateKey >= term.start_date && dateKey <= term.end_date,
        ) ?? null
    );
}

function mondayOnOrAfter(date: Date): Date {
    const day = date.getDay();

    if (day === 1) {
        return date;
    }

    const diffToNextMonday = day === 0 ? 1 : 8 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToNextMonday);

    return monday;
}

/**
 * Which "week" of the term a date falls in, counting Monday–Saturday blocks
 * from the term's first Monday — Sundays are a rest day and don't belong to
 * any week. Week 1 starts on the term's start date itself if it's already a
 * Monday, otherwise on the following Monday, so a mid-week start doesn't tack
 * a stray partial week onto the front. Mirrors AcademicTerm::weekNumberFor()
 * on the backend.
 */
function weekNumberForDate(date: Date, term: AcademicTermData): number | null {
    const key = toKey(date);

    if (key < term.start_date || key > term.end_date || date.getDay() === 0) {
        return null;
    }

    const start = new Date(`${term.start_date}T00:00:00`);
    const firstMonday = mondayOnOrAfter(start);

    if (date.getTime() < firstMonday.getTime()) {
        return null;
    }

    const diffDays = Math.round(
        (date.getTime() - firstMonday.getTime()) / 86400000,
    );

    return Math.floor(diffDays / 7) + 1;
}

/**
 * Whether a HyFlex group ("A" or "B") is face-to-face or synchronous for a
 * given week number. Mirrors AcademicTerm::hyflexModeForWeek() on the
 * backend: week 1 is always synchronous for both groups; from week 2 they
 * alternate weekly, with group A synchronous on even weeks / face-to-face
 * on odd weeks, and group B always the opposite that same week.
 */
function hyflexModeForWeek(week: number, group: 'A' | 'B'): 'f2f' | 'online' {
    if (week <= 1) {
        return 'online';
    }

    const groupAIsSynchronousThisWeek = week % 2 === 0;
    const isGroupA = group === 'A';

    return isGroupA === groupAIsSynchronousThisWeek ? 'online' : 'f2f';
}

function getMonthGrid(year: number, month: number): Date[] {
    const firstOfMonth = new Date(year, month, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Date[] = [];

    for (let i = startWeekday; i > 0; i--) {
        cells.push(new Date(year, month, 1 - i));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(new Date(year, month, d));
    }

    let next = 1;

    while (cells.length % 7 !== 0) {
        cells.push(new Date(year, month + 1, next));
        next++;
    }

    return cells;
}

function formatDeadlineTime(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

function formatFullDate(date: Date): string {
    return new Intl.DateTimeFormat('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function formatClassTime(time: string | null): string | null {
    if (!time) {
        return null;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;

    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatDateRange(start: string, end: string): string {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    const fmt = (d: Date) =>
        new Intl.DateTimeFormat('en-PH', {
            month: 'short',
            day: 'numeric',
        }).format(d);

    if (start === end) {
        return fmt(startDate);
    }

    return `${fmt(startDate)} – ${fmt(endDate)}`;
}

export default function Calendar({
    terms,
    pending_deadlines,
    my_classes,
    announcements,
}: CalendarPageProps) {
    useAnnouncementUpdates();

    const { auth } = usePage<PageProps>().props;
    const isStudent = auth?.user?.role === 'student';
    const isProfessor = auth?.user?.role === 'professor';
    const isAdmin = auth?.user?.role === 'admin';

    const today = useMemo(() => new Date(), []);
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);

    const periods = useMemo(() => buildPeriods(terms), [terms]);
    const grid = useMemo(
        () => getMonthGrid(viewYear, viewMonth),
        [viewYear, viewMonth],
    );
    const todayKey = toKey(today);

    const weekRows = useMemo(() => {
        const rows: { cells: Date[]; label: string | null }[] = [];

        for (let i = 0; i < grid.length; i += 7) {
            const cells = grid.slice(i, i + 7);
            const monday = cells[1];
            const term = findTermForDate(toKey(monday), terms);
            const weekNumber = term ? weekNumberForDate(monday, term) : null;

            rows.push({
                cells,
                label: weekNumber ? `Week ${weekNumber}` : null,
            });
        }

        return rows;
    }, [grid, terms]);

    const todayHyflex = useMemo(() => {
        const term = findTermForDate(todayKey, terms);
        const weekNumber = term ? weekNumberForDate(today, term) : null;

        if (weekNumber === null) {
            return null;
        }

        return {
            week: weekNumber,
            a: hyflexModeForWeek(weekNumber, 'A'),
            b: hyflexModeForWeek(weekNumber, 'B'),
        };
    }, [terms, today, todayKey]);

    const periodsForDay = (date: Date) => {
        const key = toKey(date);

        return periods.filter((p) => key >= p.start && key <= p.end);
    };

    const deadlinesForDay = (date: Date) => {
        const key = toKey(date);

        return pending_deadlines.filter((d) => d.date === key);
    };

    const classesForDay = (date: Date) => {
        const weekday = FULL_WEEKDAYS[date.getDay()];

        return my_classes.filter((c) => c.class_day === weekday);
    };

    const announcementForDay = (date: Date) => {
        const key = toKey(date);

        return announcements.find((a) => a.date === key) ?? null;
    };

    const selectedDateObj = selectedDate
        ? new Date(`${selectedDate}T00:00:00`)
        : null;
    const selectedDayDeadlines = selectedDateObj
        ? deadlinesForDay(selectedDateObj)
        : [];
    const selectedDayClasses = selectedDateObj
        ? classesForDay(selectedDateObj)
        : [];
    const selectedAnnouncement = selectedDateObj
        ? announcementForDay(selectedDateObj)
        : null;

    const saveAnnouncement = () => {
        if (!selectedDate) {
            return;
        }

        router.post(
            '/admin/calendar/announcements',
            {
                date: selectedDate,
                title: titleRef.current?.value ?? '',
                description: descriptionRef.current?.value ?? '',
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const deleteAnnouncement = (id: number) => {
        router.delete(`/admin/calendar/announcements/${id}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const sortedDeadlines = useMemo(
        () =>
            [...pending_deadlines].sort((a, b) =>
                a.deadline.localeCompare(b.deadline),
            ),
        [pending_deadlines],
    );

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const goToToday = () => {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
    };

    const monthLabel = new Intl.DateTimeFormat('en-PH', {
        month: 'long',
        year: 'numeric',
    }).format(new Date(viewYear, viewMonth, 1));

    const upcomingPeriods = useMemo(
        () => periods.filter((p) => p.end >= todayKey),
        [periods, todayKey],
    );

    return (
        <>
            <Head title="Calendar" />

            <div className="min-h-full bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <section className="rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <CalendarDays className="size-4" />
                            Academic Calendar
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">Calendar</h1>
                        <p className="mt-2 text-sm text-red-100">
                            Prelims, Midterm, and Finals periods are shaded
                            automatically based on each academic term's dates.
                        </p>
                        {todayHyflex && (
                            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/15 px-4 py-3 text-sm">
                                <span className="font-semibold text-white">
                                    Week {todayHyflex.week} HyFlex Schedule:
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 font-semibold text-white">
                                    HyFlex A ·{' '}
                                    {todayHyflex.a === 'f2f'
                                        ? 'Face-to-Face'
                                        : 'Synchronous'}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 font-semibold text-white">
                                    HyFlex B ·{' '}
                                    {todayHyflex.b === 'f2f'
                                        ? 'Face-to-Face'
                                        : 'Synchronous'}
                                </span>
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={goToPrevMonth}
                                    className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                <h2 className="min-w-40 text-center font-semibold text-slate-900">
                                    {monthLabel}
                                </h2>
                                <button
                                    type="button"
                                    onClick={goToNextMonth}
                                    className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    type="button"
                                    onClick={goToToday}
                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Today
                                </button>
                                <div className="flex items-center gap-3 text-xs">
                                    {(
                                        Object.keys(
                                            PERIOD_LABELS,
                                        ) as PeriodKind[]
                                    ).map((kind) => (
                                        <div
                                            key={kind}
                                            className="flex items-center gap-1.5"
                                        >
                                            <span
                                                className={`size-2.5 rounded-full ${PERIOD_STYLES[kind].dot}`}
                                            />
                                            <span className="text-slate-600">
                                                {PERIOD_LABELS[kind]}
                                            </span>
                                        </div>
                                    ))}
                                    {isStudent && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="size-2.5 rounded-full bg-red-600 ring-2 ring-white" />
                                            <span className="text-slate-600">
                                                Deadline
                                            </span>
                                        </div>
                                    )}
                                    {isProfessor && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="size-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                                            <span className="text-slate-600">
                                                Class
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-full bg-amber-400" />
                                        <span className="text-slate-600">
                                            Announcement
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            {WEEKDAYS.map((day) => (
                                <div key={day} className="py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {weekRows.map((row, rowIndex) => (
                            <div key={rowIndex}>
                                {row.label && (
                                    <div className="border-b border-slate-100 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                                        {row.label}
                                    </div>
                                )}
                                <div className="grid grid-cols-7">
                                    {row.cells.map((date, index) => {
                                        const key = toKey(date);
                                        const isCurrentMonth =
                                            date.getMonth() === viewMonth;
                                        const isToday = key === todayKey;
                                        const isSelected = key === selectedDate;
                                        const dayPeriods = periodsForDay(date);
                                        const primaryPeriod =
                                            dayPeriods[0] ?? null;
                                        const dayDeadlines =
                                            deadlinesForDay(date);
                                        const dayClasses = isProfessor
                                            ? classesForDay(date)
                                            : [];
                                        const dayAnnouncement =
                                            announcementForDay(date);

                                        const tooltipParts = [
                                            ...dayPeriods.map(
                                                (p) =>
                                                    `${PERIOD_LABELS[p.kind]} — ${p.termName}`,
                                            ),
                                            ...dayDeadlines.map(
                                                (d) =>
                                                    `Due: ${d.title} (${d.subject})`,
                                            ),
                                            ...dayClasses.map(
                                                (c) => `Class: ${c.subject}`,
                                            ),
                                            ...(dayAnnouncement
                                                ? [dayAnnouncement.title]
                                                : []),
                                        ];

                                        return (
                                            <button
                                                type="button"
                                                key={`${key}-${index}`}
                                                onClick={() =>
                                                    setSelectedDate(key)
                                                }
                                                title={tooltipParts.join(', ')}
                                                className={`relative min-h-20 border-r border-b border-slate-100 p-2 text-left hover:bg-red-50/40 focus:outline-none ${
                                                    !isCurrentMonth
                                                        ? 'bg-slate-50/60 text-slate-300'
                                                        : 'text-slate-700'
                                                } ${primaryPeriod && isCurrentMonth ? PERIOD_STYLES[primaryPeriod.kind].bg : ''} ${
                                                    dayAnnouncement &&
                                                    isCurrentMonth
                                                        ? 'ring-1 ring-amber-400 ring-inset'
                                                        : ''
                                                } ${isSelected ? 'ring-2 ring-red-600 ring-inset' : ''}`}
                                            >
                                                {dayDeadlines.length > 0 &&
                                                    isCurrentMonth && (
                                                        <span
                                                            aria-label="Pending deadline"
                                                            className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-red-600 ring-2 ring-white"
                                                        />
                                                    )}
                                                {dayClasses.length > 0 &&
                                                    isCurrentMonth && (
                                                        <span
                                                            aria-label="Class today"
                                                            className="absolute top-1.5 left-1.5 size-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                                                        />
                                                    )}
                                                <div
                                                    className={`inline-flex size-6 items-center justify-center rounded-full text-sm ${
                                                        isToday
                                                            ? 'bg-red-600 font-semibold text-white'
                                                            : ''
                                                    }`}
                                                >
                                                    {date.getDate()}
                                                </div>
                                                {dayPeriods.length > 0 &&
                                                    isCurrentMonth && (
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {dayPeriods.map(
                                                                (p, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className={`size-1.5 rounded-full ${PERIOD_STYLES[p.kind].dot}`}
                                                                    />
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                {dayAnnouncement &&
                                                    isCurrentMonth && (
                                                        <p className="mt-1 truncate text-[10px] font-semibold text-amber-700">
                                                            {
                                                                dayAnnouncement.title
                                                            }
                                                        </p>
                                                    )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </section>

                    {selectedDateObj && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                                <h2 className="font-semibold text-slate-900">
                                    {formatFullDate(selectedDateObj)}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(null)}
                                    className="text-sm font-semibold text-slate-500 hover:text-red-700"
                                >
                                    Clear
                                </button>
                            </div>

                            <div className="space-y-5 p-5">
                                {selectedAnnouncement && (
                                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                        <Megaphone className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                        <div>
                                            <p className="font-semibold text-amber-900">
                                                {selectedAnnouncement.title}
                                            </p>
                                            {selectedAnnouncement.description && (
                                                <p className="mt-1 text-sm text-amber-800">
                                                    {
                                                        selectedAnnouncement.description
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isProfessor && (
                                    <div>
                                        <p className="mb-2 text-sm font-semibold text-slate-700">
                                            Your Classes
                                        </p>
                                        {selectedDayClasses.length > 0 ? (
                                            <ul className="space-y-2">
                                                {selectedDayClasses.map(
                                                    (course) => (
                                                        <li
                                                            key={course.id}
                                                            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                        >
                                                            <span className="font-medium text-slate-900">
                                                                {course.subject}
                                                            </span>
                                                            <span className="text-slate-500">
                                                                {formatClassTime(
                                                                    course.class_start_time,
                                                                ) &&
                                                                formatClassTime(
                                                                    course.class_end_time,
                                                                )
                                                                    ? `${formatClassTime(course.class_start_time)} – ${formatClassTime(course.class_end_time)}`
                                                                    : 'No time set'}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-slate-500">
                                                No classes scheduled this day.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {isStudent && (
                                    <div>
                                        <p className="mb-2 text-sm font-semibold text-slate-700">
                                            Deadlines
                                        </p>
                                        {selectedDayDeadlines.length > 0 ? (
                                            <ul className="space-y-2">
                                                {selectedDayDeadlines.map(
                                                    (deadline) => (
                                                        <li
                                                            key={deadline.id}
                                                            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                        >
                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {
                                                                        deadline.title
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {
                                                                        deadline.subject
                                                                    }
                                                                </p>
                                                            </div>
                                                            <span className="font-semibold text-red-700">
                                                                {formatDeadlineTime(
                                                                    deadline.deadline,
                                                                )}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-slate-500">
                                                No deadlines due this day.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {isAdmin && (
                                    <div
                                        key={selectedDate}
                                        className="space-y-3"
                                    >
                                        <p className="text-sm font-semibold text-slate-700">
                                            Announcement
                                        </p>
                                        <div className="grid gap-2">
                                            <Label htmlFor="announcement_title">
                                                Title
                                            </Label>
                                            <input
                                                id="announcement_title"
                                                ref={titleRef}
                                                defaultValue={
                                                    selectedAnnouncement?.title ??
                                                    ''
                                                }
                                                placeholder="e.g. Foundation Day"
                                                className="h-10 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="announcement_description">
                                                Description
                                            </Label>
                                            <textarea
                                                id="announcement_description"
                                                ref={descriptionRef}
                                                defaultValue={
                                                    selectedAnnouncement?.description ??
                                                    ''
                                                }
                                                rows={3}
                                                placeholder="What's happening this day?"
                                                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={saveAnnouncement}
                                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                            >
                                                Save
                                            </button>
                                            {selectedAnnouncement && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteAnnouncement(
                                                            selectedAnnouncement.id,
                                                        )
                                                    }
                                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {isStudent && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
                                <AlertCircle className="size-4 text-red-600" />
                                <h2 className="font-semibold text-slate-900">
                                    Pending Deadlines
                                </h2>
                            </div>

                            {sortedDeadlines.length > 0 ? (
                                <ul className="divide-y divide-slate-100">
                                    {sortedDeadlines.map((deadline) => (
                                        <li
                                            key={deadline.id}
                                            className="flex items-center justify-between gap-4 px-5 py-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="size-2.5 rounded-full bg-red-600" />
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        {deadline.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {deadline.subject}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-red-700">
                                                {formatDeadlineTime(
                                                    deadline.deadline,
                                                )}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex min-h-32 flex-col items-center justify-center text-center">
                                    <AlertCircle className="size-8 text-slate-300" />
                                    <p className="mt-2 text-sm text-slate-500">
                                        Nothing pending — you're all caught up.
                                    </p>
                                </div>
                            )}
                        </section>
                    )}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h2 className="font-semibold text-slate-900">
                                Upcoming &amp; Current Periods
                            </h2>
                        </div>

                        {upcomingPeriods.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {upcomingPeriods.map((period, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between gap-4 px-5 py-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`size-2.5 rounded-full ${PERIOD_STYLES[period.kind].dot}`}
                                            />
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {PERIOD_LABELS[period.kind]}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {period.termName}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {formatDateRange(
                                                period.start,
                                                period.end,
                                            )}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex min-h-32 flex-col items-center justify-center text-center">
                                <CalendarDays className="size-8 text-slate-300" />
                                <p className="mt-2 text-sm text-slate-500">
                                    No exam periods scheduled yet.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
