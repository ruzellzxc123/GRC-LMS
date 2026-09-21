import {
    Award,
    BarChart3,
    BookOpen,
    Calendar,
    CalendarCheck,
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    GraduationCap,
    LayoutDashboard,
    LibraryBig,
    MessageSquare,
    Users,
} from 'lucide-react';
import type { NavItem } from '@/types';

export const studentNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/student/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'My Subjects',
        href: '/student/courses',
        icon: BookOpen,
    },
    {
        title: 'Attendance',
        href: '/student/attendance',
        icon: CalendarCheck,
    },
    {
        title: 'Scores',
        href: '/student/scores',
        icon: Award,
    },
    {
        title: 'Feedback',
        href: '/student/feedback',
        icon: MessageSquare,
    },
    {
        title: 'Calendar',
        href: '/student/calendar',
        icon: Calendar,
    },
];

export const professorNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/professor/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Subjects',
        href: '/professor/courses',
        icon: BookOpen,
    },
    {
        title: 'Quizzes',
        href: '/professor/quizzes',
        icon: ClipboardList,
    },
    {
        title: 'Grades',
        href: '/professor/grades',
        icon: GraduationCap,
    },
    {
        title: 'Feedback',
        href: '/professor/feedback',
        icon: MessageSquare,
    },
    {
        title: 'Calendar',
        href: '/professor/calendar',
        icon: Calendar,
    },
];

export const adminNavItems: NavItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Students',
        href: '/admin/students',
        icon: Users,
    },
    {
        title: 'Professors',
        href: '/admin/professors',
        icon: GraduationCap,
    },
    {
        title: 'Subjects',
        href: '/admin/courses',
        icon: BookOpen,
    },
    {
        title: 'Departments',
        href: '/admin/departments',
        icon: LibraryBig,
    },
    {
        title: 'Terms',
        href: '/admin/terms',
        icon: CalendarDays,
    },
    {
        title: 'Activities',
        href: '/admin/activities',
        icon: ClipboardList,
    },
    {
        title: 'Grading',
        href: '/admin/grading',
        icon: ClipboardCheck,
    },
    {
        title: 'Reports',
        href: '/admin/reports',
        icon: BarChart3,
    },
    {
        title: 'Calendar',
        href: '/admin/calendar',
        icon: Calendar,
    },
];
