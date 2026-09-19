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
  return <GalleryPage type="photography" />;
}

export function PaintingPage() {
  return <GalleryPage type="painting" />;
}
