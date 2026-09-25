import { FormEvent, useEffect, useState } from "react";
import { galleryService } from "../../services/admin";
import type { GalleryType, GalleryWork } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Input";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/ui/Modal";
import { useDebounce } from "../../hooks/useDebounce";
import { Card } from "../../components/ui/Card";

const emptyForm = {
  title: "",
  short_description: "",
  description: "",
  alt_text: "",
  is_published: true,
  sort_order: 0,
};

export function GalleryAdminPage({ type }: { type: GalleryType }) {
  const { push } = useToast();
  const label = type === "photography" ? "Photography" : "Painting";
  const [items, setItems] = useState<GalleryWork[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryWork | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const debounced = useDebounce(search);

  async function load() {
    const result = await galleryService.list({ type, search: debounced, page });
    setItems(result.items);
    setLastPage(result.meta.last_page);
  }

  useEffect(() => {
    load().catch((error) => push(getErrorMessage(error), "error"));
  }, [type, debounced, page]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setOpen(true);
  }

  function openEdit(work: GalleryWork) {
    setEditing(work);
    setForm({
      title: work.title,
      short_description: work.short_description || "",
      description: work.description || "",
      alt_text: work.alt_text || "",
      is_published: work.is_published,
      sort_order: work.sort_order,
    });
    setFile(null);
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing && !file) {
      push("Choose an image to upload.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("short_description", form.short_description);
      payload.append("description", form.description);
      payload.append("alt_text", form.alt_text);
      payload.append("is_published", form.is_published ? "1" : "0");
      payload.append("sort_order", String(form.sort_order));
      if (file) payload.append("file", file);

      if (editing) {
        await galleryService.update(editing.id, payload);
        push(`${label} updated`);
      } else {
        payload.append("type", type);
        await galleryService.create(payload);
        push(`${label} uploaded`);
      }

      setOpen(false);
      await load();
    } catch (error) {
      push(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gallery</p>
          <h1 className="font-display text-3xl sm:text-4xl">{label}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload {type === "photography" ? "photographs" : "paintings"} with ALT text, an image description for the gallery page, and a short description for the opened view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={type === "photography" ? "/photography" : "/painting"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800"
          >
            View public {label.toLowerCase()}
          </a>
          <Button variant="rust" onClick={openCreate}>
            Add {type === "photography" ? "photograph" : "painting"}
          </Button>
        </div>
      </div>

      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden p-0">
            <img src={item.url} alt={item.alt_text || item.title} className="aspect-[4/3] w-full object-cover" />
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-zinc-500">{item.is_published ? "Published" : "Draft"} · order {item.sort_order}</p>
                </div>
              </div>
              {item.description ? <p className="text-sm text-zinc-600 dark:text-paper-100/70 line-clamp-2">{item.description}</p> : null}
              {item.short_description ? <p className="text-xs text-zinc-500 line-clamp-1">Open: {item.short_description}</p> : null}
              <p className="truncate text-xs text-zinc-500">ALT: {item.alt_text || "—"}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openEdit(item)}>Edit</Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    galleryService
                      .destroy(item.id)
                      .then(() => {
                        push("Deleted");
                        return load();
                      })
                      .catch((error) => push(getErrorMessage(error), "error"))
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-zinc-300 px-6 py-16 text-center text-sm text-zinc-500 dark:border-ink-700">
          No {label.toLowerCase()} works yet. Upload the first one.
        </p>
      ) : null}

      <Pagination page={page} lastPage={lastPage} onChange={setPage} />

      <Modal open={open} title={editing ? `Edit ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`} onClose={() => setOpen(false)} className="max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Image" hint={editing ? "Leave empty to keep the current image." : "JPG, PNG, WebP, or SVG up to 8MB."}>
            <Input type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required={!editing} />
          </Field>
          {editing?.url ? <img src={editing.url} alt={editing.alt_text || editing.title} className="max-h-40 rounded-2xl object-cover" /> : null}
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={180} />
          </Field>
          <Field label="Short description" hint="Shown under the title when someone opens the image.">
            <Textarea value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} maxLength={300} />
          </Field>
          <Field label="Image description" hint="Shown as the teaser under each image on the gallery page (not inside the opened view).">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={5000} />
          </Field>
          <Field label="ALT text" hint="Accessibility text for screen readers and SEO.">
            <Input value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} maxLength={180} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort order">
              <Input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
              />
            </Field>
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              Published on the public site
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="rust" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function PhotographyAdminPage() {
  return <GalleryAdminPage type="photography" />;
}

export function PaintingAdminPage() {
  return <GalleryAdminPage type="painting" />;
}
