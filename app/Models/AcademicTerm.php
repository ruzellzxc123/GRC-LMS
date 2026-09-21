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
        'start_date',
        'end_date',
        'prelims_start',
        'prelims_end',
        'midterm_start',
        'midterm_end',
        'finals_start',
        'finals_end',
        'hyflex_first_f2f_group',
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
     * Whether a HyFlex group ("A" or "B") is face-to-face or online for a
     * given week number. The group set as `hyflex_first_f2f_group` is
     * face-to-face on odd weeks (1, 3, 5...) and online on even weeks; the
     * other group is always the mirror opposite that same week. Returns
     * null when the admin hasn't configured a HyFlex schedule for this term.
     */
    public function hyflexModeForWeek(int $week, string $group): ?string
    {
        if ($this->hyflex_first_f2f_group === null) {
            return null;
        }

        $isOddWeek = $week % 2 === 1;
        $groupStartsF2f = $group === $this->hyflex_first_f2f_group;

        return $isOddWeek === $groupStartsF2f ? 'f2f' : 'online';
    }
}
