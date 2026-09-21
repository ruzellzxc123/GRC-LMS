import { Link } from '@inertiajs/react';
import { BookOpen, CalendarDays, ChevronRight, Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface DueActivity {
    id: number;
    title: string;
    course: string;
    due: string;
}

const activities: DueActivity[] = [
    {
        id: 1,
        title: 'Mathematics in the Modern World',
        course: 'Activity 1',
        due: 'Today, 11:59 PM',
    },
    {
        id: 2,
        title: 'Fundamentals of Programming',
        course: 'Exercise 1',
        due: 'Tomorrow, 10:00 AM',
    },
    {
        id: 3,
        title: 'Purposive Communication',
        course: 'Activity 2',
        due: 'August 8, 2026',
    },
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RightDashboardSidebar() {
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        setToday(new Date());
    }, []);

    const calendar = useMemo(() => {
        if (!today) {
            return null;
        }

        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        const days: Array<number | null> = [
            ...Array.from({ length: firstDay }, () => null),
            ...Array.from({ length: totalDays }, (_, index) => index + 1),
        ];

        return {
            days,
            currentDay: today.getDate(),
            monthLabel: today.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
            }),
        };
    }, [today]);

    return (
        <aside className="w-full xl:sticky xl:top-4 xl:self-start">
            <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50/80 p-4 shadow-sm">
                <div className="border-b border-red-200 pb-3">
                    <p className="text-xs font-semibold tracking-wider text-red-600 uppercase">
                        Student Center
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-red-950">
                        Today&apos;s Overview
                    </h2>
                </div>

                {/* Bible verse */}
                <section className="group rounded-xl border border-red-200 bg-white p-4 transition duration-200 hover:border-red-400 hover:bg-red-100/70 hover:shadow-md">
                    <div className="flex items-center gap-2 text-red-700">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 transition group-hover:bg-red-600 group-hover:text-white">
                            <BookOpen className="h-4 w-4" />
                        </div>

                        <h3 className="font-semibold">
                            Bible Verse of the Day
                        </h3>
                    </div>

                    <blockquote className="mt-4 text-sm leading-6 text-slate-700">
                        “Thy word is a lamp unto my feet, and a light unto my
                        path.”
                    </blockquote>

                    <p className="mt-3 text-xs font-semibold text-red-700">
                        Psalm 119:105 KJV
                    </p>
                </section>
                {/* Activities Due */}
                <section className="rounded-xl border border-red-200 bg-white p-4 transition duration-200 hover:border-red-400 hover:shadow-md">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-700">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                                <Clock3 className="h-4 w-4" />
                            </div>

                            <div>
                                <h3 className="font-semibold">
                                    Activities Due
                                </h3>

                                <p className="text-xs text-slate-500">
                                    5 activities due
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/dashboard?section=assignments"
                            className="text-xs font-semibold text-red-600 transition hover:text-red-800"
                        >
                            View all
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {activities.map((activity) => (
                            <Link
                                key={activity.id}
                                href={`/dashboard?activity=${activity.id}`}
                                className="group/activity flex items-start justify-between gap-3 rounded-lg border border-transparent p-3 transition hover:border-red-200 hover:bg-red-50"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-800 group-hover/activity:text-red-700">
                                        {activity.title}
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-500">
                                        {activity.course}
                                    </p>

                                    <p className="mt-2 text-xs font-medium text-red-600">
                                        {activity.due}
                                    </p>
                                </div>

                                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-hover/activity:translate-x-1 group-hover/activity:text-red-600" />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Calendar */}
                <section className="rounded-xl border border-red-200 bg-white p-4 transition duration-200 hover:border-red-400 hover:shadow-md">
                    <div className="mb-4 flex items-center gap-2 text-red-700">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                            <CalendarDays className="h-4 w-4" />
                        </div>

                        <div>
                            <h3 className="font-semibold">Calendar</h3>

                            <p className="text-xs text-slate-500">
                                {calendar?.monthLabel ?? 'Loading calendar...'}
                            </p>
                        </div>
                    </div>

                    {calendar ? (
                        <div>
                            <div className="grid grid-cols-7 gap-1">
                                {weekDays.map((day) => (
                                    <div
                                        key={day}
                                        className="py-1 text-center text-[10px] font-semibold text-slate-400 uppercase"
                                    >
                                        {day.substring(0, 1)}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-1 grid grid-cols-7 gap-1">
                                {calendar.days.map((day, index) => {
                                    const isToday = day === calendar.currentDay;

                                    return (
                                        <div
                                            key={`${day}-${index}`}
                                            className="flex aspect-square items-center justify-center"
                                        >
                                            {day && (
                                                <button
                                                    type="button"
                                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${
                                                        isToday
                                                            ? 'bg-red-600 text-white shadow-sm hover:bg-red-700'
                                                            : 'text-slate-600 hover:bg-red-100 hover:text-red-700'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-52 animate-pulse rounded-lg bg-red-50" />
                    )}

                    <Link
                        href="/dashboard?section=schedule"
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-600 hover:text-white"
                    >
                        Open full schedule
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </section>
            </div>
        </aside>
    );
}
