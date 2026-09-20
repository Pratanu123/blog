import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { SiteSettings } from "../../types";
import { WelcomeWitch } from "../../components/home/WelcomeWitch";
import { PageBackLink } from "../../components/nav/PageBackLink";
import { inspirationThoughts } from "../../utils/siteContent";

const bubbleStyles = [
  { width: "w-full max-w-2xl", padding: "px-5 py-4 sm:px-8 sm:py-7 md:px-10 md:py-8", text: "text-base sm:text-lg md:text-xl leading-7 sm:leading-8", offset: "self-center", delay: "0ms", duration: "2.1s" },
  { width: "w-full max-w-xl", padding: "px-5 py-4 sm:px-7 sm:py-6 md:px-9 md:py-7", text: "text-base md:text-lg leading-7", offset: "self-center md:self-start md:ml-6", delay: "60ms", duration: "2.25s" },
  { width: "w-full max-w-lg", padding: "px-5 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6", text: "text-base leading-7", offset: "self-center md:self-end md:mr-8", delay: "120ms", duration: "2.4s" },
  { width: "w-full max-w-md", padding: "px-5 py-4 sm:px-6 sm:py-5 md:px-7", text: "text-sm sm:text-base leading-6", offset: "self-center md:self-start md:ml-14", delay: "180ms", duration: "2.55s" },
  { width: "w-full max-w-md md:max-w-sm", padding: "px-5 py-4 md:px-6 md:py-5", text: "text-sm leading-6", offset: "self-center md:self-end md:mr-16", delay: "240ms", duration: "2.7s" },
  { width: "w-full max-w-md md:max-w-xs", padding: "px-5 py-4 md:px-5 md:py-4", text: "text-sm leading-6", offset: "self-center md:self-start md:ml-24", delay: "300ms", duration: "2.85s" },
  { width: "w-full max-w-md md:max-w-[14rem]", padding: "px-5 py-3.5 md:px-4 md:py-3", text: "text-sm leading-5", offset: "self-center md:self-end md:mr-24", delay: "360ms", duration: "3s" },
  { width: "w-full max-w-sm md:max-w-xs", padding: "px-5 py-3.5 md:px-3.5 md:py-2.5", text: "text-sm md:text-xs leading-5", offset: "self-center", delay: "420ms", duration: "3.15s" },
] as const;

const trailRects = [
  { w: "w-8", h: "h-5", radius: "rounded-xl" },
  { w: "w-6", h: "h-4", radius: "rounded-lg" },
  { w: "w-4", h: "h-3", radius: "rounded-md" },
  { w: "w-3", h: "h-2.5", radius: "rounded" },
  { w: "w-2", h: "h-2", radius: "rounded-sm" },
] as const;

const floatingLanterns = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  pattern: (i % 3) + 1,
  tint: (i % 3) + 1,
  x: 4 + ((i * 19) % 88),
  size: 3.4 + ((i * 7) % 5) * 0.4,
  // Negative delays = already rising when the page opens
  delay: -((i * 4.2) % 22),
  duration: 32 + (i % 5) * 5,
  sway: 2.4 + (i % 4) * 1.2,
}));

export function AboutPage() {
  const { settings } = useOutletContext<{ settings: SiteSettings }>();
  const thoughts = useMemo(() => inspirationThoughts(settings), [settings]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const eyebrow = settings.inspiration_eyebrow?.trim() || "Blog Inspiration";
  const title = settings.inspiration_title?.trim() || "Thoughts rising from the newsroom";
  const footer = settings.inspiration_footer?.trim() || "Editor at the desk";

  return (
    <div className="relative overflow-x-clip">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(196,92,38,0.12),transparent_55%),radial-gradient(ellipse_at_80%_40%,rgba(22,19,16,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(196,92,38,0.18),transparent_55%),radial-gradient(ellipse_at_20%_60%,rgba(251,247,240,0.04),transparent_45%)]"
      />

      <div className="inspiration-lanterns" aria-hidden="true">
        {floatingLanterns.map((lantern) => (
          <span
            key={lantern.id}
            className={`inspiration-lantern inspiration-lantern--p${lantern.pattern} inspiration-lantern--t${lantern.tint}`}
            style={{
              left: `${lantern.x}%`,
              width: `${lantern.size}rem`,
              height: `${lantern.size * 1.35}rem`,
              animationDelay: `${lantern.delay}s`,
              animationDuration: `${lantern.duration}s`,
              ["--inspiration-lantern-sway" as string]: `${lantern.sway}vw`,
            }}
          >
            <span className="inspiration-lantern-string" />
            <span className="inspiration-lantern-cap inspiration-lantern-cap--top" />
            <span className="inspiration-lantern-paper">
              <span className="inspiration-lantern-fold" />
              <span className="inspiration-lantern-glow-core" />
            </span>
            <span className="inspiration-lantern-cap inspiration-lantern-cap--bottom" />
            <span className="inspiration-lantern-tassel" />
            <span className="inspiration-lantern-glow" />
          </span>
        ))}
      </div>

      <div className="relative z-[1] mx-auto flex max-w-3xl flex-col px-4 pb-10 pt-16">
        <div className="mb-6 flex justify-center">
          <PageBackLink to="/" label="Back to Home" />
        </div>
        <p className="text-center text-xs uppercase tracking-[0.24em] text-rust-600">{eyebrow}</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-center font-display text-4xl leading-tight md:text-5xl">
          {title}
        </h1>

        <div className="thought-stream mt-12 flex flex-col items-center gap-4 md:gap-5">
          {thoughts.map((thought, index) => {
            const style = bubbleStyles[index % bubbleStyles.length];
            const isActive = activeIndex === index;
            return (
              <div
                key={`${index}-${thought.slice(0, 24)}`}
                className={`thought-float ${style.width} ${style.offset}`}
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

        <div className="relative mx-auto mt-1 flex w-full max-w-sm flex-col items-center overflow-visible">
          <WelcomeWitch className="inspiration-witch" />
          <p className="mt-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}
