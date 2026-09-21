import { usePage } from '@inertiajs/react';
import { FloatingDock } from '@/components/floating-dock';
import { FloatingIdentityBar } from '@/components/floating-identity-bar';
import {
    adminNavItems,
    professorNavItems,
    studentNavItems,
} from '@/config/sidebar-navigation';
import type { Auth } from '@/types/auth';

interface AppDockLayoutPageProps {
    auth?: Auth;
    pending_deadlines_count?: number;
    has_new_content?: boolean;
    [key: string]: unknown;
}

const PORTAL_LABEL: Record<string, string> = {
    admin: 'Admin Portal',
    professor: 'Professor Portal',
    student: 'Student Portal',
};

const PORTAL_HOME: Record<string, string> = {
    admin: '/admin/dashboard',
    professor: '/professor/dashboard',
    student: '/student/dashboard',
};

export default function AppDockLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { auth, pending_deadlines_count, has_new_content } =
        usePage<AppDockLayoutPageProps>().props;

    const userRole = auth?.user?.role ?? 'student';

    const navigationItems = (
        userRole === 'admin'
            ? adminNavItems
            : userRole === 'professor'
              ? professorNavItems
              : studentNavItems
    ).map((item) => {
        if (userRole !== 'student') {
            return item;
        }

        if (
            item.href === '/student/calendar' &&
            (pending_deadlines_count ?? 0) > 0
        ) {
            return { ...item, hasBadge: true };
        }

        if (item.href === '/student/courses' && has_new_content) {
            return { ...item, hasBadge: true };
        }

        return item;
    });

    return (
        <div className="relative min-h-screen w-full bg-background">
            <FloatingIdentityBar
                homeUrl={PORTAL_HOME[userRole]}
                subtitle={PORTAL_LABEL[userRole] ?? 'GRC LMS'}
            />

            <main className="mx-auto w-full max-w-[1600px] px-4 pt-15 pb-32 md:px-8">
                {children}
            </main>

            <FloatingDock items={navigationItems} />
        </div>
    );
}
