import { router } from '@inertiajs/react';
import { MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

export interface CommentItem {
    id: number;
    body: string;
    author_name: string;
    author_role: string;
    created_at: string;
}

interface ContentCommentThreadProps {
    comments: CommentItem[];
    postUrl: string;
}

function formatTimestamp(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(date));
}

const ROLE_BADGE_STYLES: Record<string, string> = {
    professor: 'bg-red-100 text-red-700',
    student: 'bg-blue-100 text-blue-700',
    admin: 'bg-slate-200 text-slate-700',
};

export default function ContentCommentThread({
    comments,
    postUrl,
}: ContentCommentThreadProps) {
    const [expanded, setExpanded] = useState(false);
    const [body, setBody] = useState('');
    const [processing, setProcessing] = useState(false);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!body.trim()) {
            return;
        }

        setProcessing(true);

        router.post(
            postUrl,
            { body },
            {
                preserveScroll: true,
                onSuccess: () => setBody(''),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="mt-3 border-t border-slate-100 pt-3">
            <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
                <MessageCircle className="size-3.5" />
                {comments.length > 0
                    ? `${comments.length} comment${comments.length === 1 ? '' : 's'}`
                    : 'Comment'}
            </button>

            {expanded && (
                <div className="mt-3 space-y-3">
                    {comments.length > 0 && (
                        <ul className="space-y-2.5">
                            {comments.map((comment) => (
                                <li
                                    key={comment.id}
                                    className="rounded-lg bg-slate-50 p-2.5"
                                >
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs font-semibold text-slate-800">
                                            {comment.author_name}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${
                                                ROLE_BADGE_STYLES[
                                                    comment.author_role
                                                ] ??
                                                'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {comment.author_role}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            {formatTimestamp(
                                                comment.created_at,
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-700">
                                        {comment.body}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}

                    <form onSubmit={submit} className="flex items-start gap-2">
                        <textarea
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            placeholder="Write a comment..."
                            rows={2}
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        />
                        <button
                            type="submit"
                            disabled={processing || !body.trim()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send className="size-3.5" />
                            {processing ? 'Posting...' : 'Post'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
