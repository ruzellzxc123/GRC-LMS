import { Head, router, usePage } from '@inertiajs/react';
import { Eye, Video } from 'lucide-react';
import BackLink from '@/components/back-link';
import JitsiMeeting from '@/components/jitsi-meeting';
import type { Auth } from '@/types';

interface Courseware {
    id: number;
    subject: string;
}

interface Meeting {
    domain: string;
    room_name: string;
    is_embedded: boolean;
}

interface AdminLiveClassShowProps {
    courseware: Courseware;
    meeting: Meeting;
}

interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

export default function AdminLiveClassShow({
    courseware,
    meeting,
}: AdminLiveClassShowProps) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title={`Observing — ${courseware.subject}`} />

            <div className="min-h-screen bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <BackLink href="/admin/live-classes">
                        Back to live classes
                    </BackLink>

                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm md:p-8">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Eye className="size-4" />
                            Observing
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {courseware.subject}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            You're joining as an admin observer — you'll appear
                            in the participant list clearly labeled as such, and
                            you won't have moderator or recording controls. The
                            professor may need to admit you from the waiting
                            room.
                        </p>
                    </section>

                    {!meeting.is_embedded ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                            <Video className="mx-auto size-10 text-slate-300" />
                            <h2 className="mt-3 font-semibold text-slate-900">
                                Custom meeting link
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                This subject uses an external meeting link, so
                                it can't be observed from this dashboard.
                            </p>
                        </section>
                    ) : (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="h-[70vh]">
                                <JitsiMeeting
                                    domain={meeting.domain}
                                    roomName={meeting.room_name}
                                    displayName={`${auth.user.name} (Admin Observer)`}
                                    email={auth.user.email}
                                    isModerator={false}
                                    onLeave={() =>
                                        router.visit('/admin/live-classes')
                                    }
                                />
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}
