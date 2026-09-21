<?php

namespace App\Models;

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
        'course_code',
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
        'midterm_period_weight',
        'midterm_weight',
        'finals_weight',
        'meeting_link',
        'meeting_started_at',
        'class_day',
        'class_start_time',
        'class_end_time',
    ];

    protected function casts(): array
    {
        return [
            'prelims_weight' => 'decimal:2',
            'midterm_period_weight' => 'decimal:2',
            'midterm_weight' => 'decimal:2',
            'finals_weight' => 'decimal:2',
            'meeting_started_at' => 'datetime',
            'class_start_time' => 'datetime:H:i',
            'class_end_time' => 'datetime:H:i',
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

    /**
     * The live meeting link for this subject. Professors can override with
     * their own link (Meet, Zoom, etc.); otherwise every subject gets a
     * ready-to-use Jitsi Meet room with no setup required.
     */
    public function meetingUrl(): string
    {
        if (! empty($this->meeting_link)) {
            return $this->meeting_link;
        }

        $room = 'GRCLMS-'.$this->id.'-'.Str::slug($this->subject);

        return "https://meet.jit.si/{$room}";
    }

    /**
     * Whether the meeting link is our own Jitsi room (as opposed to a
     * professor-supplied external link, e.g. Zoom or Google Meet) — only
     * our own rooms can be embedded with host controls via the IFrame API.
     */
    public function usesEmbeddedMeeting(): bool
    {
        return Str::contains($this->meetingUrl(), 'meet.jit.si');
    }

    public function isMeetingLive(): bool
    {
        return $this->meeting_started_at !== null;
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
     * Whether this subject's HyFlex group is face-to-face or online for the
     * current week — the same week-based rotation shown on uploads, just
     * evaluated for right now instead of an upload's date. Null when the
     * subject isn't assigned a HyFlex group, has no academic term, the term
     * isn't currently running, or the term hasn't configured a rotation.
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
