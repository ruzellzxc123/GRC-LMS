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

            // Student IDs are permanent once the account is created — only
            // validated here on registration ($userId === null). Profile
            // updates never accept this field, so it can't be changed.
            ...($userId === null ? [
                'student_id' => $this->studentIdRules(),
            ] : []),

            'email' => $this->emailRules($userId),

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

            'program' => [
                'required',
                'string',
                'max:150',
            ],
        ];
    }

    /**
     * The student ID prefix must match the year the account is created in
     * (i.e. the enrollment year) — enforced server-side since the client
     * only shows this as a locked, non-editable label.
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
                $currentYear = (string) now()->year;

                if (! str_starts_with($value, $currentYear)) {
                    $fail("The student id must start with the current enrollment year ({$currentYear}).");
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
