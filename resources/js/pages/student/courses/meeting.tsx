import { Head, router, usePage, usePoll } from '@inertiajs/react';
import { Clock, Video } from 'lucide-react';
import { useEffect } from 'react';
import BackLink from '@/components/back-link';
import JitsiMeeting from '@/components/jitsi-meeting';
import { Spinner } from '@/components/ui/spinner';
import { formatTime12h } from '@/lib/format-time';
import type { Auth } from '@/types';

interface Courseware {
    id: number;
    subject: string;
}

type ScheduleState = 'no_schedule' | 'before' | 'in_window' | 'after';

interface Meeting {
    url: string;
    domain: string;
    room_name: string;
    is_embedded: boolean;
    is_live: boolean;
    schedule_state: ScheduleState;
    class_start_time: string | null;
    class_end_time: string | null;
}

interface StudentMeetingProps {
    courseware: Courseware;
    meeting: Meeting;
}

interface PageProps {
    auth: Auth;
    [key: string]: unknown;
}

export default function StudentMeeting({
    courseware,
    meeting,
}: StudentMeetingProps) {
    const { auth } = usePage<PageProps>().props;

    const canAttemptJoin =
        meeting.schedule_state === 'no_schedule' ||
        meeting.schedule_state === 'in_window';
    const isLiveAndOpen = canAttemptJoin && meeting.is_live;

    const { stop } = usePoll(6000, { only: ['meeting'] }, { keepAlive: true });

    useEffect(() => {
        if (
            isLiveAndOpen ||
            !meeting.is_embedded ||
            meeting.schedule_state === 'after'
        ) {
            stop();
        }
    }, [isLiveAndOpen, meeting.is_embedded, meeting.schedule_state, stop]);

    const scheduleLabel =
        meeting.class_start_time && meeting.class_end_time
            ? `${formatTime12h(meeting.class_start_time)} – ${formatTime12h(meeting.class_end_time)}`
            : null;

    return (
        <>
            <Head title={`Meeting — ${courseware.subject}`} />

            <div className="min-h-screen bg-slate-50 p-4 md:p-6">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <BackLink href={`/student/courses/${courseware.id}`}>
                        Back to subject
                    </BackLink>

                    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-6 text-white shadow-sm md:p-8">
                        <div className="flex items-center gap-2 text-sm text-red-100">
                            <Video className="size-4" />
                            Live Class
                        </div>
                        <h1 className="mt-2 text-2xl font-bold">
                            {courseware.subject}
                        </h1>
                        {scheduleLabel && (
                            <p className="mt-2 text-sm text-red-100">
                                Scheduled class time: {scheduleLabel}
                            </p>
                        )}
                    </section>

                    {!meeting.is_embedded ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                            <Video className="mx-auto size-10 text-slate-300" />
                            <h2 className="mt-3 font-semibold text-slate-900">
                                External meeting link
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Your professor uses a custom video call link for
                                this subject.
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
                    ) : meeting.schedule_state === 'before' ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                            <Clock className="mx-auto size-10 text-slate-300" />
                            <h2 className="mt-3 font-semibold text-slate-900">
                                Class hasn't started yet
                            </h2>
                            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                                You can join once class begins
                                {scheduleLabel ? ` at ${scheduleLabel}` : ''}.
                                This page will update automatically.
                            </p>
                        </section>
                    ) : meeting.schedule_state === 'after' ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                            <Clock className="mx-auto size-10 text-slate-300" />
                            <h2 className="mt-3 font-semibold text-slate-900">
                                Class time has ended
                            </h2>
                            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                                Today's scheduled window
                                {scheduleLabel ? ` (${scheduleLabel})` : ''} has
                                passed.
                            </p>
                        </section>
                    ) : !meeting.is_live ? (
                        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                            <Spinner className="mx-auto size-8 text-red-600" />
                            <h2 className="mt-3 font-semibold text-slate-900">
                                Waiting for your professor to start class
                            </h2>
                            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                                This page will update automatically the moment
                                class starts.
                            </p>
                            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <Clock className="size-3.5" />
                                Checking every few seconds…
                            </p>
                        </section>
                    ) : (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-5 py-3">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                    <span className="relative flex size-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                    </span>
                                    Class is live — you may be asked to wait for
                                    the professor to admit you
                                </span>
                            </div>
                            <div className="h-[70vh]">
                                <JitsiMeeting
                                    domain={meeting.domain}
                                    roomName={meeting.room_name}
                                    displayName={auth.user.name}
                                    email={auth.user.email}
                                    isModerator={false}
                                    onLeave={() =>
                                        router.visit(
                                            `/student/courses/${courseware.id}`,
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
