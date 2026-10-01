<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Validation rules for registration and profile updates.
     *
     * @return array<string, mixed>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'name' => $this->nameRules(),

            // Student IDs are permanent once the account is created, and
            // email changes go through their own verified flow
            // (EmailChangeController) — both are only validated here on
            // registration ($userId === null). A profile update never
            // accepts either field.
            ...($userId === null ? [
                'student_id' => $this->studentIdRules(),
                'email' => $this->emailRules($userId),
            ] : []),

            'birthday' => [
                'required',
                'date',
                'before:today',
            ],

            'year_level' => [
                'required',
                'string',
                Rule::in([
                    '1st Year',
                    '2nd Year',
                    '3rd Year',
                    '4th Year',
                    '5th Year',
                ]),
            ],

            'section' => [
                'required',
                'regex:/^\d{3}$/',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $expectedPrefix = match (request()->input('year_level')) {
                        '1st Year' => '1',
                        '2nd Year' => '2',
                        '3rd Year' => '3',
                        '4th Year' => '4',
                        default => null,
                    };

                    if ($expectedPrefix !== null && ! str_starts_with((string) $value, $expectedPrefix)) {
                        $fail('The section must match the selected year level.');
                    }
                },
            ],
        ];
    }

    /**
     * The year-month prefix is fixed to whenever the account is actually
     * created — enforced here since the client only shows it as a locked
     * label and submits it concatenated with the 5-digit number typed
     * after it (see the student ID field in register.tsx).
     *
     * @return array<int, mixed>
     */
    protected function studentIdRules(): array
    {
        return [
            'required',
            'string',
            'regex:/^\d{4}-\d{2}-\d{5}$/',
            function (string $attribute, mixed $value, \Closure $fail): void {
                $prefix = User::currentStudentIdPrefix();

                if (! str_starts_with($value, $prefix)) {
                    $fail("The student id must start with {$prefix}.");
                }
            },
            Rule::unique(User::class, 'student_id'),
        ];
    }

    /**
     * @return array<int, string>
     */
    protected function nameRules(): array
    {
        return [
            'required',
            'string',
            'max:255',
        ];
    }

    /**
     * @return array<int, mixed>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class, 'email')
                : Rule::unique(User::class, 'email')
                    ->ignore($userId),
        ];
    }
}
