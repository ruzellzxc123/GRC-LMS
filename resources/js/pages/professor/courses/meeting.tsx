import { Head, router, usePage } from '@inertiajs/react';
import { PhoneOff, ShieldCheck, Video } from 'lucide-react';
import { useState } from 'react';
import BackLink from '@/components/back-link';
import JitsiMeeting from '@/components/jitsi-meeting';
import { formatTime12h } from '@/lib/format-time';
import type { Auth } from '@/types';

interface Courseware {
    id: number;
    subject: string;
    course_code: string | null;
}

interface Meeting {
    url: string;
    domain: string;
    room_name: string;
    is_embedded: boolean;
    is_live: boolean;
    class_start_time: string | null;
    class_end_time: string | null;
}

interface ProfessorMeetingProps {
    courseware: Courseware;
    meeting: Meeting;
}

interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

export default function ProfessorMeeting({
    courseware,
    meeting,
}: ProfessorMeetingProps) {
    const { auth } = usePage<PageProps>().props;
    const [starting, setStarting] = useState(false);
    const [ending, setEnding] = useState(false);

    const startMeeting = () => {
        setStarting(true);
        router.post(
            `/professor/courses/${courseware.id}/meeting/start`,
            {},
            { preserveScroll: true, onFinish: () => setStarting(false) },
        );
    };

    const endMeeting = () => {
        setEnding(true);
        router.post(
            `/professor/courses/${courseware.id}/meeting/end`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setEnding(false),
            },
        );
    };

    const scheduleLabel =
        meeting.class_start_time && meeting.class_end_time
            ? `${formatTime12h(meeting.class_start_time)} – ${formatTime12h(meeting.class_end_time)}`
            : null;

    return (
        <>
            <Head title={`Meeting — ${courseware.subject}`} />

            <div className="min-h-screen bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <BackLink
                        href={`/professor/courses/${courseware.id}/roster`}
                    >
                        Back to roster
                    </BackLink>

                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm md:p-8">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Video className="size-4" />
                            Live Class
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {courseware.subject}
                            {courseware.course_code
                                ? ` (${courseware.course_code})`
                                : ''}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-red-100">
                            {meeting.is_embedded
                                ? "As the host, starting the class automatically enables a waiting room — students you haven't admitted yet will wait until you let them in."
                                : 'This subject uses a custom meeting link. Manage waiting room and host controls from that provider directly.'}
                        </p>
                        {scheduleLabel && (
                            <p className="mt-2 text-sm text-red-100">
                                Scheduled class time: {scheduleLabel} — students
                                can only join during this window.
                            </p>
                        )}
                    </section>

                    {!meeting.is_embedded ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                            <Video className="mx-auto size-10 text-slate-300" />
                            <h2 className="mt-3 font-semibold text-slate-900">
                                Custom meeting link
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Host controls and waiting rooms aren't available
                                for external links from this dashboard.
                            </p>
                            <a
                                href={meeting.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                <Video className="size-4" />
                                Open meeting link
                            </a>
                        </section>
                    ) : !meeting.is_live ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                            <ShieldCheck className="mx-auto size-10 text-red-600" />
                            <h2 className="mt-3 font-semibold text-slate-900">
                                Ready to start class
                            </h2>
                            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                                Students will only be able to join once you
                                start the meeting, and a waiting room keeps them
                                out until you admit them — same as Google Meet.
                            </p>
                            <button
                                type="button"
                                onClick={startMeeting}
                                disabled={starting}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Video className="size-4" />
                                {starting ? 'Starting…' : 'Start Meeting'}
                            </button>
                        </section>
                    ) : (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                    <span className="relative flex size-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                    </span>
                                    Class is live
                                </span>
                                <button
                                    type="button"
                                    onClick={endMeeting}
                                    disabled={ending}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <PhoneOff className="size-4" />
                                    {ending
                                        ? 'Ending…'
                                        : 'End Meeting for Everyone'}
                                </button>
                            </div>
                            <div className="h-[70vh]">
                                <JitsiMeeting
                                    domain={meeting.domain}
                                    roomName={meeting.room_name}
                                    displayName={auth.user.name}
                                    email={auth.user.email}
                                    isModerator
                                    onLeave={() =>
                                        router.visit(
                                            `/professor/courses/${courseware.id}/roster`,
                                        )
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
