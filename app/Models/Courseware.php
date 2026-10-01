<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Courseware extends Model
{
    use HasFactory;

    /**
     * The database table used by the model.
     */
    protected $table = 'courseware';

    /**
     * Columns that may be mass assigned.
     */
    protected $fillable = [
        'subject',
        'subject_code',
        'professor',
        'professor_id',
        'module_title',
        'year_level',
        'section',
        'hyflex_group',
        'department_id',
        'academic_term_id',
        'prelims_weight',
        'midterm_weight',
        'finals_weight',
        'meeting_link',
        'meeting_started_at',
        'schedule_mode',
        'class_day',
        'class_start_time',
        'class_end_time',
        'class_day_2',
        'class_start_time_2',
        'class_end_time_2',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'prelims_weight' => 'decimal:2',
            'midterm_weight' => 'decimal:2',
            'finals_weight' => 'decimal:2',
            'meeting_started_at' => 'datetime',
            'class_start_time' => 'datetime:H:i',
            'class_end_time' => 'datetime:H:i',
            'class_start_time_2' => 'datetime:H:i',
            'class_end_time_2' => 'datetime:H:i',
            'archived_at' => 'datetime',
        ];
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function academicTerm()
    {
        return $this->belongsTo(AcademicTerm::class, 'academic_term_id');
    }

    public function professorAccount()
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function gradeCategories()
    {
        return $this->hasMany(GradeCategory::class);
    }

    public function contentCategories()
    {
        return $this->hasMany(CourseContentCategory::class);
    }

    public function meetingSessions()
    {
        return $this->hasMany(MeetingSession::class);
    }

    public function classReports()
    {
        return $this->hasMany(ClassReport::class);
    }

    /**
     * The currently-live meeting session (if any) — looked up fresh rather
     * than cached on the courseware row, since "live" just means no
     * ended_at yet.
     */
    public function activeMeetingSession(): ?MeetingSession
    {
        return $this->meetingSessions()->whereNull('ended_at')->latest('started_at')->first();
    }

    /**
     * The live meeting link for this subject. Professors can override with
     * their own link (Meet, Zoom, etc.); otherwise every subject gets a
     * ready-to-use Jitsi Meet room on our own self-hosted instance
     * (JITSI_DOMAIN), with no per-subject setup required.
     *
     * The room name is keyed on the courseware's id alone, never its
     * subject text — renaming a subject (including via Reuse, which
     * explicitly allows it) must never change the link students and the
     * professor already have bookmarked/shared.
     */
    public function meetingUrl(): string
    {
        if (! empty($this->meeting_link)) {
            return $this->meeting_link;
        }

        $room = 'GRCLMS-'.$this->id;
        $domain = config('services.jitsi.domain');

        return "https://{$domain}/{$room}";
    }

    /**
     * Whether the meeting link is our own Jitsi room (as opposed to a
     * professor-supplied external link, e.g. Zoom or Google Meet) — only
     * our own rooms can be embedded with host controls via the IFrame API.
     */
    public function usesEmbeddedMeeting(): bool
    {
        return Str::contains($this->meetingUrl(), config('services.jitsi.domain'));
    }

    public function isMeetingLive(): bool
    {
        return $this->meeting_started_at !== null;
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * Whether today falls inside this subject's academic term — the
     * authoritative check for whether its meetings can be joined/started at
     * all, independent of archived_at (which is only set lazily by the
     * archive-ended-terms middleware and may not have run yet). A subject
     * with no term assigned has no boundary to enforce.
     */
    public function isWithinTermSchedule(): bool
    {
        return $this->academicTerm === null || $this->academicTerm->isActive();
    }

    public function scopeActive(Builder $query): void
    {
        $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): void
    {
        $query->whereNotNull('archived_at');
    }

    /**
     * Whether the current class schedule allows a student to attempt to
     * join right now — 'no_schedule' means the professor never set a class
     * time, so joining is only gated by whether the meeting is live.
     */
    public function classScheduleState(): string
    {
        if ($this->class_start_time === null || $this->class_end_time === null) {
            return 'no_schedule';
        }

        $now = now();

        if ($now->lt($this->class_start_time)) {
            return 'before';
        }

        if ($now->gt($this->class_end_time)) {
            return 'after';
        }

        return 'in_window';
    }

    /**
     * Whether this subject's HyFlex group is face-to-face or synchronous for
     * the current week — the same week-based rotation shown on uploads, just
     * evaluated for right now instead of an upload's date. Null only when
     * the subject isn't assigned a HyFlex group, has no academic term, or
     * that term isn't currently running — the rotation itself is a fixed
     * rule (see AcademicTerm::hyflexModeForWeek()), not something that can
     * be left unconfigured.
     */
    public function todaysHyflexMode(): ?string
    {
        if ($this->hyflex_group === null) {
            return null;
        }

        $term = $this->academicTerm;

        if ($term === null || ! $term->isActive()) {
            return null;
        }

        return $term->hyflexModeForWeek($term->weekNumberFor(now()), $this->hyflex_group);
    }
}
