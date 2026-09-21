import { Head } from '@inertiajs/react';
import RightDashboardSidebar from '@/components/right-dashboard-sidebar';
import CourseDashboard from '@/pages/CourseDashboard';

export default function Dashboard() {
    return (
        <>
            <Head title="LMS Dashboard" />

            <div className="min-h-full bg-red-50/30 p-4 md:p-6">
                <div className="mx-auto grid w-full max-w-[1600px] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="min-w-0">
                        <CourseDashboard />
                    </main>

                    <RightDashboardSidebar />
                </div>
            </div>
        </>
    );
}
