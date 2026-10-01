<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class AcademicTerm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'semester',
        'start_date',
        'end_date',
        'prelims_start',
        'prelims_end',
        'midterm_start',
        'midterm_end',
        'finals_start',
        'finals_end',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date' => 'date:Y-m-d',
        'prelims_start' => 'date:Y-m-d',
        'prelims_end' => 'date:Y-m-d',
        'midterm_start' => 'date:Y-m-d',
        'midterm_end' => 'date:Y-m-d',
        'finals_start' => 'date:Y-m-d',
        'finals_end' => 'date:Y-m-d',
    ];

    public function courses()
    {
        return $this->hasMany(Courseware::class);
    }

    /**
     * A term is active for as long as today falls within its overall
     * start/end span — there's no manual toggle for this anymore.
     */
    public function isActive(): bool
    {
        $today = today();

        return $today->gte($this->start_date) && $today->lte($this->end_date);
    }

    /**
     * Which week of the term a date falls in, counting 7-day blocks (Monday
     * through the following Sunday) from the term's first Monday. Week 1
     * starts on the term's start date itself if it's already a Monday,
     * otherwise on the following Monday — so a term that starts mid-week
     * doesn't get a stray partial week tacked onto the front, which would
     * otherwise push an 18-week term to 19. Every upload needs a week label,
     * so dates outside the term span are clamped to the nearest edge (before
     * the term start, or before its first Monday, lands in week 1; after the
     * term end lands in its last week) rather than returning null.
     */
    public function weekNumberFor(Carbon|string $date): int
    {
        $date = Carbon::parse($date)->startOfDay();
        $start = Carbon::parse($this->start_date)->startOfDay();
        $end = Carbon::parse($this->end_date)->startOfDay();

        if ($date->lt($start)) {
            $date = $start->copy();
        } elseif ($date->gt($end)) {
            $date = $end->copy();
        }

        $daysToNextMonday = (8 - $start->dayOfWeekIso) % 7;
        $firstMonday = $start->copy()->addDays($daysToNextMonday);

        if ($date->lt($firstMonday)) {
            return 1;
        }

        $diffDays = $firstMonday->diffInDays($date);

        return (int) floor($diffDays / 7) + 1;
    }

    /**
     * Whether a HyFlex group ("A" or "B") is face-to-face or synchronous for
     * a given week number — a fixed rule, not a per-term configurable
     * choice. Week 1 is always synchronous for both groups (no one comes to
     * campus in week 1). From week 2 onward the groups alternate weekly:
     * group A is synchronous on even weeks / face-to-face on odd weeks, and
     * group B is always the mirror opposite that same week.
     */
    public function hyflexModeForWeek(int $week, string $group): ?string
    {
        if ($week <= 1) {
            return 'online';
        }

        $groupAIsSynchronousThisWeek = $week % 2 === 0;
        $isGroupA = $group === 'A';

        return $isGroupA === $groupAIsSynchronousThisWeek ? 'online' : 'f2f';
    }
}
