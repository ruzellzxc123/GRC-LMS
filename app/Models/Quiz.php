<?php

namespace App\Models;

use App\Models\Concerns\HasDeadlineOverride;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    use HasDeadlineOverride;

    protected $fillable = [
        'courseware_id',
        'title',
        'description',
        'deadline',
        'is_published',
        'weight',
        'term',
        'timing_mode',
        'time_limit_minutes',
        'questions_to_answer',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'deadline' => 'datetime',
            'weight' => 'decimal:2',
            'time_limit_minutes' => 'integer',
            'questions_to_answer' => 'integer',
        ];
    }

    public function courseware()
    {
        return $this->belongsTo(Courseware::class);
    }

    public function questions()
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('order');
    }

    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * The single module this quiz was attached to, if it was created from
     * (or later attached to) a module's own "Add Quiz" flow rather than
     * standalone from the quizzes list.
     */
    public function contentItem()
    {
        return $this->hasOne(CourseContentItem::class);
    }

    /**
     * Randomly pick which question ids a new attempt is given, when the
     * professor asks for fewer answers than the full bank holds — each
     * student then gets a different subset in a different order, so
     * answers can't just be copied from someone else's screen. Null means
     * "use the full bank" (either no limit was set, or the limit isn't
     * actually smaller than the bank), which also keeps existing quizzes
     * behaving exactly as before this feature existed.
     */
    public function selectQuestionIdsForAttempt(): ?array
    {
        $allIds = $this->questions()->pluck('id')->all();

        if ($this->questions_to_answer === null || $this->questions_to_answer >= count($allIds)) {
            return null;
        }

        shuffle($allIds);

        return array_slice($allIds, 0, $this->questions_to_answer);
    }

    /**
     * The questions belonging to one specific attempt — its own
     * randomly-selected subset, in the order it was assigned, or the full
     * bank in question order when no subset was selected for it.
     */
    public function questionsForAttempt(QuizAttempt $attempt)
    {
        if ($attempt->selected_question_ids === null) {
            return $this->questions->load('options');
        }

        $questionsById = $this->questions->load('options')->keyBy('id');

        return collect($attempt->selected_question_ids)
            ->map(fn ($id) => $questionsById->get($id))
            ->filter()
            ->values();
    }
}
