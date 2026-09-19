import { useEffect, useState } from "react";
import { publicService } from "../../services/public";
import type { GalleryType, GalleryWork } from "../../types";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";

const copy: Record<GalleryType, { eyebrow: string; title: string; body: string }> = {
  photography: {
    eyebrow: "Photography",
    title: "Light, place, and the frame around both.",
    body: "A separate gallery of photographs — each with its own ALT text, short caption, and description.",
  },
  painting: {
    eyebrow: "Painting",
    title: "Color held still long enough to look twice.",
    body: "A separate gallery of paintings — each with its own ALT text, short caption, and description.",
  },
};

export function GalleryPage({ type }: { type: GalleryType }) {
  const [items, setItems] = useState<GalleryWork[] | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [active, setActive] = useState<GalleryWork | null>(null);
  const meta = copy[type];

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

  if (!items) return <Spinner label={`Opening ${meta.eyebrow.toLowerCase()}`} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.24em] text-rust-600">{meta.eyebrow}</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight">{meta.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-700 dark:text-paper-100/75">{meta.body}</p>

      {items.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="Nothing hung yet" body={`Upload ${meta.eyebrow.toLowerCase()} works from the admin panel.`} />
        </div>
      ) : (
        <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              className="mb-6 block w-full break-inside-avoid text-left"
            >
              <img
                src={item.url}
                alt={item.alt_text || item.title}
                className="w-full rounded-[1.4rem] object-cover"
              />
              <p className="mt-3 font-display text-2xl leading-tight">{item.title}</p>
              {item.short_description ? (
                <p className="mt-1 text-sm leading-6 text-ink-700 dark:text-paper-100/70">{item.short_description}</p>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Pagination page={page} lastPage={lastPage} onChange={setPage} />
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-ink-950/70" onClick={() => setActive(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            className="relative z-10 grid max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-paper-50 dark:bg-ink-900 md:grid-cols-[1.2fr_1fr]"
          >
            <img src={active.url} alt={active.alt_text || active.title} className="h-full max-h-[90vh] w-full object-cover" />
            <div className="space-y-4 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-rust-600">{meta.eyebrow}</p>
              <h2 className="font-display text-3xl">{active.title}</h2>
              {active.short_description ? <p className="text-sm leading-7 text-ink-700 dark:text-paper-100/75">{active.short_description}</p> : null}
              {active.description ? <p className="text-sm leading-7 text-ink-700 dark:text-paper-100/75">{active.description}</p> : null}
              <p className="text-xs text-zinc-500">ALT: {active.alt_text || "—"}</p>
              <button type="button" onClick={() => setActive(null)} className="rounded-full border px-4 py-2 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
