import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { SiteSettings } from "../../types";

const THOUGHT_COUNT = 8;

const FALLBACK_THOUGHTS = [
  "Ink & Voltage is an independent editorial project — long-form writing on software, design, and the systems underneath both.",
  "We still believe a sentence can carry more weight than a dashboard full of metrics.",
  "The quieter decisions are usually the ones that make products last.",
  "Editors want a quiet room with the right levers in reach, not another control panel.",
  "Publish when the thought is ready. Not when the calendar asks.",
  "A magazine should feel like a mind at work — curious, unfinished, and alive.",
  "Design is the way an idea arrives before anyone has to explain it.",
  "Stay with the draft until the words start answering back.",
];

function splitIntoThoughts(content: string | undefined): string[] {
  const source = (content || "").trim();
  if (!source) return FALLBACK_THOUGHTS;

  const sentences = source
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((part) => part.trim())
    .filter(Boolean) ?? [source];

  if (sentences.length >= THOUGHT_COUNT) {
    return sentences.slice(0, THOUGHT_COUNT);
  }

  if (sentences.length === 1) {
    const words = source.split(/\s+/);
    const chunk = Math.ceil(words.length / THOUGHT_COUNT);
    return Array.from({ length: THOUGHT_COUNT }, (_, index) => {
      const slice = words.slice(index * chunk, (index + 1) * chunk).join(" ");
      return slice || FALLBACK_THOUGHTS[index];
    });
  }

  const thoughts = [...sentences];
  while (thoughts.length < THOUGHT_COUNT) {
    thoughts.push(FALLBACK_THOUGHTS[thoughts.length] || thoughts[thoughts.length - 1]);
  }
  return thoughts.slice(0, THOUGHT_COUNT);
}

const bubbleStyles = [
  { width: "max-w-2xl", padding: "px-8 py-7 md:px-10 md:py-8", text: "text-lg md:text-xl leading-8", offset: "self-center", delay: "0ms", duration: "2.1s" },
  { width: "max-w-xl", padding: "px-7 py-6 md:px-9 md:py-7", text: "text-base md:text-lg leading-7", offset: "self-start md:ml-6", delay: "60ms", duration: "2.25s" },
  { width: "max-w-lg", padding: "px-6 py-5 md:px-8 md:py-6", text: "text-base leading-7", offset: "self-end md:mr-8", delay: "120ms", duration: "2.4s" },
  { width: "max-w-md", padding: "px-6 py-5 md:px-7 md:py-5", text: "text-sm md:text-base leading-6", offset: "self-start md:ml-14", delay: "180ms", duration: "2.55s" },
  { width: "max-w-sm", padding: "px-5 py-4 md:px-6 md:py-5", text: "text-sm leading-6", offset: "self-end md:mr-16", delay: "240ms", duration: "2.7s" },
  { width: "max-w-xs", padding: "px-4 py-3.5 md:px-5 md:py-4", text: "text-sm leading-6", offset: "self-start md:ml-24", delay: "300ms", duration: "2.85s" },
  { width: "max-w-[14rem]", padding: "px-4 py-3", text: "text-xs md:text-sm leading-5", offset: "self-end md:mr-24", delay: "360ms", duration: "3s" },
  { width: "max-w-[11rem]", padding: "px-3.5 py-2.5", text: "text-xs leading-5", offset: "self-center", delay: "420ms", duration: "3.15s" },
] as const;

const trailRects = [
  { w: "w-8", h: "h-5", radius: "rounded-xl" },
  { w: "w-6", h: "h-4", radius: "rounded-lg" },
  { w: "w-4", h: "h-3", radius: "rounded-md" },
  { w: "w-3", h: "h-2.5", radius: "rounded" },
  { w: "w-2", h: "h-2", radius: "rounded-sm" },
] as const;

export function AboutPage() {
  const { settings } = useOutletContext<{ settings: SiteSettings }>();
  const thoughts = useMemo(() => splitIntoThoughts(settings.about_content), [settings.about_content]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(196,92,38,0.12),transparent_55%),radial-gradient(ellipse_at_80%_40%,rgba(22,19,16,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(196,92,38,0.18),transparent_55%),radial-gradient(ellipse_at_20%_60%,rgba(251,247,240,0.04),transparent_45%)]"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col px-4 pb-10 pt-16">
        <p className="text-center text-xs uppercase tracking-[0.24em] text-rust-600">Blog Inspiration</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-center font-display text-4xl leading-tight md:text-5xl">
          Thoughts rising from the newsroom
        </h1>

        <div className="thought-stream mt-12 flex flex-col items-stretch gap-4 md:gap-5">
          {thoughts.map((thought, index) => {
            const style = bubbleStyles[index];
            const isActive = activeIndex === index;
            return (
              <div
                key={`${index}-${thought.slice(0, 24)}`}
                className={`thought-float ${style.width} ${style.offset} w-full`}
                style={{ animationDelay: style.delay, animationDuration: style.duration }}
              >
                <div className="thought-rise" style={{ animationDelay: style.delay }}>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((current) => (current === index ? null : index))}
                    onBlur={() => setActiveIndex((current) => (current === index ? null : current))}
                    className={`thought-rect ${style.padding} ${style.text} ${isActive ? "is-lit" : ""}`}
                  >
                    {thought}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="thought-trail mx-auto mt-3 flex flex-col items-center gap-2.5" aria-hidden>
          {trailRects.map((rect, index) => (
            <span
              key={rect.w}
              className={`thought-trail-rect ${rect.w} ${rect.h} ${rect.radius} border border-ink-900/25 bg-paper-50/70 dark:border-paper-50/30 dark:bg-ink-800/70`}
              style={{ animationDelay: `${index * 90}ms` }}
            />
          ))}
        </div>

        <div className="relative mx-auto mt-1 flex w-full max-w-sm flex-col items-center">
          <FemaleThinker />
          <p className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-500">Editor at the desk</p>
        </div>
      </div>
    </div>
  );
}

function FemaleThinker() {
  return (
    <svg
      viewBox="0 0 220 260"
      className="mind-silhouette h-56 w-48 text-ink-900 dark:text-paper-100"
      role="img"
      aria-label="Hand-drawn female caricature thinking"
    >
      <defs>
        <style>{`
          .ink { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
          .fill-ink { fill: currentColor; }
        `}</style>
      </defs>

      {/* desk shadow */}
      <ellipse cx="110" cy="248" rx="62" ry="8" className="fill-ink" opacity="0.1" />

      {/* shoulders / sweater */}
      <path
        className="ink"
        strokeWidth="2.4"
        d="M48 236c8-34 28-52 62-52s54 18 62 52"
        fill="currentColor"
        fillOpacity="0.06"
      />
      <path className="ink" strokeWidth="2.2" d="M70 210c12 8 28 12 40 12s28-4 40-12" />

      {/* neck */}
      <path className="ink" strokeWidth="2" d="M98 168c2 14 6 22 12 28m12-28c-2 14-6 22-12 28" />

      {/* hair bun */}
      <ellipse cx="148" cy="78" rx="22" ry="20" className="ink" strokeWidth="2.2" fill="currentColor" fillOpacity="0.08" />
      <path className="ink" strokeWidth="1.8" d="M132 70c4-8 12-12 20-10m-4 18c6 2 12 0 16-6" />

      {/* hair mass */}
      <path
        className="ink"
        strokeWidth="2.3"
        fill="currentColor"
        fillOpacity="0.07"
        d="M72 118c-10-28 4-62 38-70 18-4 36 2 46 16 8 12 8 28 2 40-2 6 2 10 8 12 4 2 6 8 2 12-10 8-24 4-30-2-4 16-18 28-36 30-22 2-38-12-30-38z"
      />
      {/* loose strands */}
      <path className="ink" strokeWidth="1.6" d="M68 130c-8 10-10 24-6 36m78 8c10 6 18 18 20 30" />

      {/* face */}
      <path
        className="ink"
        strokeWidth="2.3"
        fill="currentColor"
        fillOpacity="0.04"
        d="M86 100c2-28 22-48 46-46 20 2 34 22 32 46-2 28-18 48-40 48s-40-18-38-48z"
      />

      {/* brows */}
      <path className="ink" strokeWidth="1.8" d="M96 108c8-6 16-6 22 0" />
      <path className="ink" strokeWidth="1.8" d="M128 106c7-5 14-4 20 2" />

      {/* eyes */}
      <ellipse cx="108" cy="118" rx="5.5" ry="6.5" className="ink" strokeWidth="1.8" />
      <ellipse cx="138" cy="116" rx="5.5" ry="6.5" className="ink" strokeWidth="1.8" />
      <circle cx="109.5" cy="119" r="2.2" className="fill-ink" />
      <circle cx="139.5" cy="117" r="2.2" className="fill-ink" />
      <circle cx="110.5" cy="117.5" r="0.7" fill="#fbf7f0" />
      <circle cx="140.5" cy="115.5" r="0.7" fill="#fbf7f0" />

      {/* nose */}
      <path className="ink" strokeWidth="1.7" d="M122 118c2 8 4 14 0 20" />

      {/* smile */}
      <path className="ink" strokeWidth="1.9" d="M112 146c6 7 16 8 24 2" />

      {/* cheek blush */}
      <ellipse cx="98" cy="134" rx="6" ry="3.5" fill="#c45c26" opacity="0.22" />
      <ellipse cx="148" cy="132" rx="6" ry="3.5" fill="#c45c26" opacity="0.22" />

      {/* earring */}
      <circle cx="84" cy="132" r="3" className="ink" strokeWidth="1.5" />

      {/* hand under chin */}
      <path
        className="ink"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.05"
        d="M64 178c8-4 18-2 24 6 4 6 4 14-2 18-8 6-20 2-24-8-2-6 0-12 2-16z"
      />
      <path className="ink" strokeWidth="1.6" d="M70 186c4 2 10 4 14 2m-12 8c5 1 10 0 14-3" />
    </svg>
  );
}
