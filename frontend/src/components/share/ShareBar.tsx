import { Linkedin } from "lucide-react";

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.03-9.17L1.5 2h6.75l4.66 6.18L18.244 2Zm-1.16 18h1.82L7.02 3.94H5.07L17.084 20Z" />
    </svg>
  );
}

export function ShareBar({
  url,
  title,
  eyebrow = "Pass it on",
  headline = "Share this piece",
  body = "Send it to someone who should read it — loud enough to cut through the feed.",
  className,
}: {
  url: string;
  title: string;
  eyebrow?: string;
  headline?: string;
  body?: string;
  className?: string;
}) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const xHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  return (
    <section
      className={`overflow-hidden rounded-[1.75rem] border-2 border-ink-900 bg-ink-950 text-paper-50 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.65)] dark:border-paper-50/30 ${className ?? "mt-10"}`}
    >
      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden border-b-2 border-ink-800 px-6 py-7 md:border-b-0 md:border-r-2 md:border-ink-800">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 12% 20%, rgba(196,92,38,0.55), transparent 42%), radial-gradient(circle at 88% 80%, rgba(255,255,255,0.12), transparent 36%)",
            }}
          />
          <p className="relative text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-rust-400">{eyebrow}</p>
          <h2 className="relative mt-3 font-display text-3xl leading-[0.95] sm:text-4xl md:text-5xl">{headline}</h2>
          <p className="relative mt-3 max-w-sm text-sm leading-6 text-paper-100/70">{body}</p>
        </div>
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
          <a
            href={xHref}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center justify-between gap-3 rounded-2xl bg-paper-50 px-5 py-4 text-ink-950 transition hover:-translate-y-0.5 hover:bg-white"
          >
            <span className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-950 text-paper-50">
                <XLogo className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-ink-700/70">Share on</span>
                <span className="font-display text-2xl leading-none">X</span>
              </span>
            </span>
            <span className="text-sm font-semibold text-rust-600 transition group-hover:translate-x-0.5">Open →</span>
          </a>
          <a
            href={linkedInHref}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center justify-between gap-3 rounded-2xl bg-[#0A66C2] px-5 py-4 text-white transition hover:-translate-y-0.5 hover:brightness-110"
          >
            <span className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
                <Linkedin className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Share on</span>
                <span className="font-display text-2xl leading-none">LinkedIn</span>
              </span>
            </span>
            <span className="text-sm font-semibold transition group-hover:translate-x-0.5">Open →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
