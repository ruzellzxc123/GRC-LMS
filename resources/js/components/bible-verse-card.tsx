import { BookOpenText } from 'lucide-react';
import { useMemo } from 'react';
import { BIBLE_VERSES } from '@/data/bible-verses';

function dayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();

    return Math.floor(diff / 86400000);
}

/**
 * Same verse for every role, all day — picked deterministically from
 * today's date (day-of-year mod the list length), not randomized, so it
 * doesn't change on refresh and everyone sees the same one, then rotates on
 * its own tomorrow with zero upkeep (no admin scheduling, no database row).
 */
export default function BibleVerseCard({
    className = '',
}: {
    className?: string;
}) {
    const verse = useMemo(() => {
        const index = dayOfYear(new Date()) % BIBLE_VERSES.length;

        return BIBLE_VERSES[index];
    }, []);

    return (
        <section
            className={`overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm md:p-6 ${className}`}
        >
            <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <BookOpenText className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">
                        Verse of the Day
                    </p>
                    <p className="mt-1.5 text-base leading-relaxed font-medium text-slate-800 italic md:text-lg">
                        &ldquo;{verse.text}&rdquo;
                    </p>
                    <p className="mt-2 text-sm font-semibold text-amber-700">
                        {verse.reference}
                    </p>
                </div>
            </div>
        </section>
    );
}
