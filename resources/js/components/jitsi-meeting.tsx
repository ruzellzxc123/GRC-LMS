import { WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface JitsiMeetAPI {
    dispose: () => void;
    executeCommand: (command: string, ...args: unknown[]) => void;
    addEventListener: (
        event: string,
        listener: (...args: unknown[]) => void,
    ) => void;
}

interface JitsiMeetExternalAPIConstructor {
    new (domain: string, options: Record<string, unknown>): JitsiMeetAPI;
}

declare global {
    interface Window {
        JitsiMeetExternalAPI?: JitsiMeetExternalAPIConstructor;
    }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadJitsiScript(domain: string): Promise<void> {
    if (window.JitsiMeetExternalAPI) {
        return Promise.resolve();
    }

    if (!scriptLoadPromise) {
        scriptLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://${domain}/external_api.js`;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () =>
                reject(new Error('Failed to load the Jitsi Meet script.'));
            document.body.appendChild(script);
        });
    }

    return scriptLoadPromise;
}

interface JitsiMeetingProps {
    domain: string;
    roomName: string;
    displayName: string;
    email?: string;
    /** The intended host — auto-enables the waiting room once they join. */
    isModerator: boolean;
    onLeave: () => void;
}

const TOOLBAR_BUTTONS = [
    'microphone',
    'camera',
    'desktop',
    'fullscreen',
    'fodeviceselection',
    'hangup',
    'chat',
    'raisehand',
    'videoquality',
    'filmstrip',
    'security',
    'tileview',
    'mute-everyone',
    'mute-video-everyone',
];

type Status = 'connecting' | 'ready' | 'offline' | 'error';

export default function JitsiMeeting({
    domain,
    roomName,
    displayName,
    email,
    isModerator,
    onLeave,
}: JitsiMeetingProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<JitsiMeetAPI | null>(null);
    const statusRef = useRef<Status>('connecting');
    // The video call inherently needs the internet (it's a live call hosted
    // on meet.jit.si) — check up front instead of waiting for a script-tag
    // timeout to fail.
    const [status, setStatus] = useState<Status>(() =>
        navigator.onLine ? 'connecting' : 'offline',
    );
    const [retryToken, setRetryToken] = useState(0);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        let disposed = false;

        const handleOffline = () => {
            if (disposed) {
                return;
            }

            setStatus((current) => (current === 'ready' ? current : 'offline'));
        };

        const handleOnline = () => {
            if (disposed || statusRef.current !== 'offline') {
                return;
            }

            setStatus('connecting');
            setRetryToken((token) => token + 1);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        if (!navigator.onLine) {
            return () => {
                disposed = true;
                window.removeEventListener('offline', handleOffline);
                window.removeEventListener('online', handleOnline);
            };
        }

        loadJitsiScript(domain)
            .then(() => {
                if (
                    disposed ||
                    !containerRef.current ||
                    !window.JitsiMeetExternalAPI
                ) {
                    return;
                }

                const api = new window.JitsiMeetExternalAPI(domain, {
                    roomName,
                    parentNode: containerRef.current,
                    width: '100%',
                    height: '100%',
                    userInfo: { displayName, email },
                    configOverwrite: {
                        // The host should land straight in the room after
                        // clicking "Start Meeting" — Jitsi's own prejoin
                        // screen is only useful for students, who still get
                        // a name/camera check before knocking on the lobby.
                        prejoinPageEnabled: !isModerator,
                        disableDeepLinking: true,
                        enableLobbyChat: true,
                    },
                    interfaceConfigOverwrite: {
                        TOOLBAR_BUTTONS,
                    },
                });

                apiRef.current = api;

                // The iframe is mounted and interactive as soon as the API
                // exists — don't wait for the user to get through Jitsi's
                // own prejoin screen, or the overlay below blocks clicks on
                // its "Join Meeting" button and mic/camera toggles.
                setStatus('ready');

                api.addEventListener('videoConferenceJoined', () => {
                    if (isModerator) {
                        api.executeCommand('toggleLobby', true);
                    }
                });

                api.addEventListener('readyToClose', () => {
                    onLeave();
                });
            })
            .catch(() => {
                if (!disposed) {
                    setStatus(navigator.onLine ? 'error' : 'offline');
                }
            });

        return () => {
            disposed = true;
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            apiRef.current?.dispose();
            apiRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [domain, roomName, retryToken]);

    if (status === 'offline') {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 text-center text-slate-300">
                <WifiOff className="size-10 text-slate-500" />
                <div>
                    <p className="font-semibold text-white">
                        No Internet Connection
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                        Video calls need an internet connection. The rest of the
                        app still works offline.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setStatus('connecting');
                        setRetryToken((token) => token + 1);
                    }}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-900 text-center text-slate-300">
                <p>Could not load the video call.</p>
                <p className="text-sm text-slate-400">
                    Check your internet connection and try again.
                </p>
                <button
                    type="button"
                    onClick={() => {
                        setStatus('connecting');
                        setRetryToken((token) => token + 1);
                    }}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full bg-slate-900">
            {status === 'connecting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                    <Spinner className="size-8" />
                    <p className="text-sm">Connecting to the meeting…</p>
                </div>
            )}
            <div ref={containerRef} className="h-full w-full" />
        </div>
    );
}
