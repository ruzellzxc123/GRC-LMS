export type UserRole = 'admin' | 'professor' | 'student';

export type User = {
    id: number;
    name: string;
    email: string;
    role: UserRole;

    student_id: string | null;
    birthday: string | null;
    year_level: string | null;
    section: string | null;

    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;

    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
