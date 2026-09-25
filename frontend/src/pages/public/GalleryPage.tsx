import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { publicService } from "../../services/public";
import type { GalleryType, GalleryWork, SiteSettings } from "../../types";
import { PageBackLink } from "../../components/nav/PageBackLink";
import { EngagementPanel } from "../../components/engagement/EngagementPanel";
import { WatermarkedMedia } from "../../components/media/WatermarkedMedia";
import { ShareBar } from "../../components/share/ShareBar";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { lockBodyScroll } from "../../utils/bodyScrollLock";

const galleryFallbacks: Record<GalleryType, { eyebrow: string; title: string; body: string; path: string }> = {
  photography: {
    eyebrow: "Photography",
    title: "Light, place, and the frame around both.",
    body: "A separate gallery of photographs — each with its own ALT text, short caption, and description.",
    path: "/photography",
  },
  painting: {
    eyebrow: "Painting",
    title: "Color held still long enough to look twice.",
    body: "A separate gallery of paintings — each with its own ALT text, short caption, and description.",
    path: "/painting",
  },
};

export function GalleryPage({ type }: { type: GalleryType }) {
  const { settings } = useOutletContext<{ settings: SiteSettings }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<GalleryWork[] | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [active, setActive] = useState<GalleryWork | null>(null);
  const fallback = galleryFallbacks[type];
  const meta = {
    path: fallback.path,
    eyebrow:
      (type === "photography" ? settings.photography_eyebrow : settings.painting_eyebrow)?.trim() ||
      fallback.eyebrow,
    title:
      (type === "photography" ? settings.photography_title : settings.painting_title)?.trim() ||
      fallback.title,
    body:
      (type === "photography" ? settings.photography_body : settings.painting_body)?.trim() ||
      fallback.body,
  };
  const watermark = settings.site_name?.trim() || "Ink & Voltage";

  useEffect(() => {
    setItems(null);
    publicService
      .gallery(type, page)
      .then((result) => {
        setItems(result.items);
        setLastPage(result.meta.last_page);
      })
      .catch(() => setItems([]));
  }, [type, page]);

  useEffect(() => {
    if (!items) return;
    const workId = Number(searchParams.get("work") || 0);
    if (!workId) return;
    const match = items.find((item) => item.id === workId);
    if (match) setActive(match);
  }, [items, searchParams]);

  useEffect(() => {
    if (!active) return;
    return lockBodyScroll();
  }, [active]);

  function openWork(item: GalleryWork) {
    setActive(item);
    setSearchParams({ work: String(item.id) }, { replace: true });
  }

  function closeWork() {
    setActive(null);
    setSearchParams({}, { replace: true });
  }

  if (!items) return <Spinner label={`Opening ${meta.eyebrow.toLowerCase()}`} />;

  const shareUrl = active
    ? `${window.location.origin}${meta.path}?work=${active.id}`
    : `${window.location.origin}${meta.path}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-6 flex flex-wrap gap-3">
        <PageBackLink to="/" label="Back to Home" />
      </div>
      <p className="text-xs uppercase tracking-[0.24em] text-rust-600">{meta.eyebrow}</p>
      <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight sm:text-4xl md:text-5xl">{meta.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-700 dark:text-paper-100/75">{meta.body}</p>

      {items.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="Nothing hung yet" body={`Upload ${meta.eyebrow.toLowerCase()} works from the admin panel.`} />
        </div>
      ) : (
        <div className="display-card-grid mt-12">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openWork(item)}
              className={`display-card gallery-work-card gallery-work-card--${type} text-left`}
            >
              <WatermarkedMedia
                src={item.url}
                alt={item.alt_text || item.title}
                watermark={watermark}
                compact
                className="display-card-media rounded-[1.1rem]"
                imgClassName="h-full w-full object-cover"
              />
              <div className="gallery-work-copy">
                <p className="gallery-work-title font-display text-xl leading-snug line-clamp-2">{item.title}</p>
                {item.description?.trim() ? (
                  <p className="gallery-work-excerpt mt-2 text-sm leading-6 text-ink-700 dark:text-paper-100/80">
                    {item.description.length > 110
                      ? `${item.description.slice(0, 110).replace(/\s+\S*$/, "").trimEnd()}…`
                      : item.description}{" "}
                    <span className="font-medium text-rust-600">Read More</span>
                  </p>
                ) : item.short_description?.trim() ? (
                  <p className="gallery-work-excerpt mt-2 text-sm leading-6 text-ink-700 dark:text-paper-100/80">
                    {item.short_description.length > 110
                      ? `${item.short_description.slice(0, 110).replace(/\s+\S*$/, "").trimEnd()}…`
                      : item.short_description}{" "}
                    <span className="font-medium text-rust-600">Read More</span>
                  </p>
                ) : (
                  <p className="gallery-work-excerpt mt-2 text-sm">
                    <span className="font-medium text-rust-600">Read More</span>
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Pagination page={page} lastPage={lastPage} onChange={setPage} />
      </div>

      {active
        ? createPortal(
            <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain">
              <button type="button" aria-label="Close" className="fixed inset-0 bg-ink-950/70" onClick={closeWork} />
              <div className="relative z-10 flex min-h-full items-start justify-center px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:px-5 sm:py-10">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={active.title}
                  className="relative mb-8 flex w-full max-w-5xl flex-col overflow-hidden rounded-[1.6rem] bg-paper-50 shadow-lift dark:bg-ink-900 sm:mb-0"
                >
                  <div className="sticky top-0 z-20 flex items-center justify-end border-b border-ink-100/80 bg-paper-50/95 px-3 py-2 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
                    <button
                      type="button"
                      onClick={closeWork}
                      className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-ink-100 dark:hover:bg-ink-800"
                    >
                      Close
                    </button>
                  </div>
                  <WatermarkedMedia
                    src={active.url}
                    alt={active.alt_text || active.title}
                    watermark={watermark}
                    className="shrink-0 bg-ink-950"
                    imgClassName="max-h-[min(70vh,40rem)] min-h-[12rem] w-full object-contain object-top"
                  />
                  <div className="space-y-4 p-5 pb-8 sm:p-6 sm:pb-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-rust-600">{meta.eyebrow}</p>
                    <h2 className="font-display text-3xl leading-tight">{active.title}</h2>
                    {active.short_description?.trim() ? (
                      <p className="text-sm leading-7 text-ink-700 dark:text-paper-100/75 whitespace-pre-wrap">
                        {active.short_description}
                      </p>
                    ) : null}
                    <ShareBar
                      url={shareUrl}
                      title={active.title}
                      headline="Share this work"
                      body={`Pass this ${meta.eyebrow.toLowerCase()} along — link out to X or LinkedIn.`}
                      className="mt-2"
                    />
                    <EngagementPanel type="gallery_work" id={active.id} className="pt-2" />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={closeWork}
                        className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium dark:border-ink-700 dark:bg-ink-900"
                      >
                        ← Back to {meta.eyebrow}
                      </button>
                      <PageBackLink to="/" label="Home" />
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function PhotographyPage() {
  const fireflies = Array.from({ length: 72 }, (_, i) => {
    const band = i % 3;
    // Spread across the full viewport, with extra density in the lower third
    const y =
      band === 0
        ? 6 + ((i * 13) % 28)
        : band === 1
          ? 36 + ((i * 11) % 28)
          : 68 + ((i * 7) % 28);

    return {
      id: i,
      pattern: (i % 6) + 1,
      x: ((i * 17) % 94) + 3,
      y,
      size: 0.26 + ((i * 7) % 5) * 0.08,
      delay: (i % 14) * 0.48,
      duration: 6.5 + (i % 9) * 1.2,
    };
  });

  return (
    <div className="photo-gallery-stage">
      <div className="photo-gallery-fireflies" aria-hidden="true">
        {fireflies.map((fly) => (
          <span
            key={fly.id}
            className={`photo-firefly photo-firefly--p${fly.pattern}${fly.y >= 68 ? " photo-firefly--low" : ""}`}
            style={{
              left: `${fly.x}%`,
              top: `${fly.y}%`,
              width: `${fly.size}rem`,
              height: `${fly.size}rem`,
              animationDelay: `${fly.delay}s`,
              animationDuration: `${fly.duration}s`,
            }}
          />
        ))}
      </div>
      <GalleryPage type="photography" />
    </div>
  );
}

export function PaintingPage() {
  const butterflies = Array.from({ length: 12 }, (_, i) => {
    const band = i % 3;
    const y =
      band === 0
        ? 8 + ((i * 19) % 22)
        : band === 1
          ? 38 + ((i * 17) % 24)
          : 72 + ((i * 11) % 20);

    return {
      id: i,
      pattern: (i % 4) + 1,
      tint: (i % 3) + 1,
      x: 4 + ((i * 23) % 88),
      y,
      scale: 0.7 + ((i * 5) % 4) * 0.12,
      delay: (i % 8) * 0.7,
      duration: 22 + (i % 5) * 4.2,
      flap: 0.28 + (i % 5) * 0.06,
      bob: 2.4 + (i % 4) * 0.55,
    };
  });

  return (
    <div className="paint-gallery-stage">
      <div className="paint-gallery-butterflies" aria-hidden="true">
        {butterflies.map((bug) => (
          <span
            key={bug.id}
            className={`paint-butterfly paint-butterfly--p${bug.pattern} paint-butterfly--t${bug.tint}`}
            style={{
              left: `${bug.x}%`,
              top: `${bug.y}%`,
              ["--paint-butterfly-scale" as string]: bug.scale,
              animationDelay: `${bug.delay}s`,
              animationDuration: `${bug.duration}s`,
            }}
          >
            <span
              className="paint-butterfly-motion"
              style={{
                animationDelay: `${bug.delay * 0.4}s`,
                animationDuration: `${bug.bob}s`,
              }}
            >
              <span
                className="paint-butterfly-wing paint-butterfly-wing--l"
                style={{ animationDuration: `${bug.flap}s`, animationDelay: `${bug.delay * 0.2}s` }}
              />
              <span
                className="paint-butterfly-wing paint-butterfly-wing--r"
                style={{ animationDuration: `${bug.flap}s`, animationDelay: `${bug.delay * 0.2}s` }}
              />
              <span className="paint-butterfly-body" />
              <span className="paint-butterfly-glow" />
            </span>
          </span>
        ))}
      </div>
      <GalleryPage type="painting" />
    </div>
  );
}
