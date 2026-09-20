import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { publicService, type EngagementSummary, type PublicComment } from "../../services/public";
import { getErrorMessage } from "../../services/api";
import { formatRelative } from "../../utils/format";
import { Input, Textarea, Field } from "../ui/Input";
import { cn } from "../../utils/cn";

type EngagementTarget = "article" | "gallery_work";

export function EngagementPanel({
  type,
  id,
  className,
}: {
  type: EngagementTarget;
  id: number;
  className?: string;
}) {
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    publicService
      .engagement(type, id)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load comments"));
          setSummary({ likes_count: 0, liked: false, comments_count: 0, comments: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  async function toggleLike() {
    if (likeBusy) return;
    setLikeBusy(true);
    setError("");
    try {
      const result = await publicService.toggleLike(type, id);
      setSummary((current) =>
        current
          ? { ...current, liked: result.liked, likes_count: result.likes_count }
          : { likes_count: result.likes_count, liked: result.liked, comments_count: 0, comments: [] },
      );
    } catch (err) {
      setError(getErrorMessage(err, "Could not update like"));
    } finally {
      setLikeBusy(false);
    }
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const comment = await publicService.postComment(type, id, {
        author_name: name.trim(),
        author_email: email.trim() || undefined,
        body: body.trim(),
      });
      setSummary((current) => {
        const comments = [comment, ...(current?.comments ?? [])];
        return {
          likes_count: current?.likes_count ?? 0,
          liked: current?.liked ?? false,
          comments_count: comments.length,
          comments,
        };
      });
      setBody("");
      setNotice("Comment posted.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not post comment"));
    } finally {
      setBusy(false);
    }
  }

  const comments: PublicComment[] = summary?.comments ?? [];

  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeBusy || !summary}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
            summary?.liked
              ? "border-rust-500 bg-rust-500 text-white"
              : "border-ink-300 bg-paper-50 text-ink-900 hover:border-rust-500 hover:text-rust-600 dark:border-ink-600 dark:bg-ink-900 dark:text-paper-50",
          )}
        >
          <Heart className={cn("h-4 w-4", summary?.liked ? "fill-current" : "")} aria-hidden />
          {summary?.liked ? "Liked" : "Like"}
          <span className="tabular-nums opacity-80">{summary?.likes_count ?? 0}</span>
        </button>
        <p className="inline-flex items-center gap-2 text-sm text-ink-700 dark:text-paper-100/70">
          <MessageCircle className="h-4 w-4" aria-hidden />
          {summary?.comments_count ?? 0} comments
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-ink-200 bg-paper-50/80 p-5 dark:border-ink-700 dark:bg-ink-900/70">
        <h2 className="font-display text-2xl">Comments</h2>
        <form className="mt-4 space-y-3" onSubmit={submitComment}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="Your name" />
            </Field>
            <Field label="Email" hint="Optional">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={180} placeholder="you@example.com" />
            </Field>
          </div>
          <Field label="Comment">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={2000} placeholder="Share a thought…" />
          </Field>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {notice ? <p className="text-sm text-rust-600">{notice}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-rust-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rust-600 disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            {busy ? "Posting…" : "Post comment"}
          </button>
        </form>

        <ul className="mt-6 space-y-4">
          {comments.length === 0 ? (
            <li className="text-sm text-ink-700/70 dark:text-paper-100/60">No comments yet. Be the first.</li>
          ) : (
            comments.map((comment) => (
              <li key={comment.id} className="rounded-2xl border border-ink-100 bg-white/70 px-4 py-3 dark:border-ink-700 dark:bg-ink-950/40">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900 dark:text-paper-50">{comment.author_name}</p>
                  <p className="text-xs text-ink-700/60 dark:text-paper-100/50">{formatRelative(comment.created_at)}</p>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink-700 dark:text-paper-100/80">{comment.body}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
