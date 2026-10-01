<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable([
    'name',
    'student_id',
    'email',
    'email_verified_at',
    'birthday',
    'year_level',
    'section',
    'program',
    'password',
    'password_changed_at',
])]
#[Hidden([
    'password',
    'two_factor_secret',
    'two_factor_recovery_codes',
    'remember_token',
])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    use Notifiable;
    use PasskeyAuthenticatable;
    use TwoFactorAuthenticatable;

    protected $appends = ['avatar'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'birthday' => 'date:Y-m-d',
            'password' => 'hashed',
            'password_changed_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Students whose admin-assigned password they've never changed have 3
     * days from account creation before it's due — mustChangePassword()
     * below is what actually gates access the whole time, not this.
     */
    public function mustChangePassword(): bool
    {
        return $this->role === 'student' && $this->password_changed_at === null;
    }

    /**
     * The year-month a student ID created right now must start with —
     * {year}-{month}-, e.g. "2026-10-" in October 2026. The year and month
     * are never typed by anyone; whoever creates the account only fills in
     * the 2-digit number after this prefix (student_id itself stays a
     * required, server-validated field — see ProfileValidationRules).
     */
    public static function currentStudentIdPrefix(): string
    {
        return now()->format('Y-m').'-';
    }

    protected function avatar(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->avatar_path ? Storage::url($this->avatar_path) : null,
        );
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'student_id');
    }

    public function coursesTaught()
    {
        return $this->hasMany(Courseware::class, 'professor_id');
    }

    public function feedbackReceived()
    {
        return $this->hasMany(Feedback::class, 'student_id');
    }

    public function feedbackSent()
    {
        return $this->hasMany(Feedback::class, 'professor_id');
    }

    public function quizAttempts()
    {
        return $this->hasMany(QuizAttempt::class, 'student_id');
    }

    public function classReports()
    {
        return $this->hasMany(ClassReport::class, 'professor_id');
    }
}
