import { FormEvent, useEffect, useState } from "react";
import { commentService, galleryService } from "../../services/admin";
import { articleService } from "../../services/articles";
import type { AdminComment, Article, GalleryWork } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { formatRelative } from "../../utils/format";
import { useDebounce } from "../../hooks/useDebounce";

const emptyForm = {
  target_type: "article" as "article" | "gallery_work",
  target_id: "",
  author_name: "",
  author_email: "",
  body: "",
  is_approved: true,
};

export function CommentsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<AdminComment[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState("");
  const [approved, setApproved] = useState("");
  const [editing, setEditing] = useState<AdminComment | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminComment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [articles, setArticles] = useState<Article[]>([]);
  const [galleryWorks, setGalleryWorks] = useState<GalleryWork[]>([]);
  const debouncedSearch = useDebounce(search);

  async function load() {
    const result = await commentService.list({
      page,
      search: debouncedSearch || undefined,
      target_type: targetType || undefined,
      is_approved: approved === "" ? undefined : approved === "1",
    });
    setItems(result.items);
    setLastPage(result.meta.last_page);
  }

  useEffect(() => {
    load().catch((error) => push(getErrorMessage(error), "error"));
  }, [page, debouncedSearch, targetType, approved]);

  useEffect(() => {
    if (!creating && !editing) return;
    articleService
      .list({ per_page: 50, status: "published" })
      .then((result) => setArticles(result.items))
      .catch(() => setArticles([]));
    Promise.all([
      galleryService.list({ type: "photography", per_page: 40 }),
      galleryService.list({ type: "painting", per_page: 40 }),
    ])
      .then(([photos, paintings]) => setGalleryWorks([...photos.items, ...paintings.items]))
      .catch(() => setGalleryWorks([]));
  }, [creating, editing]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setCreating(true);
  }

  function openEdit(comment: AdminComment) {
    setCreating(false);
    setEditing(comment);
    setForm({
      target_type: (comment.target_type as "article" | "gallery_work") || "article",
      target_id: String(comment.target_id),
      author_name: comment.author_name,
      author_email: comment.author_email || "",
      body: comment.body,
      is_approved: comment.is_approved,
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      target_type: form.target_type,
      target_id: Number(form.target_id),
      author_name: form.author_name.trim(),
      author_email: form.author_email.trim() || null,
      body: form.body.trim(),
      is_approved: form.is_approved,
    };
    try {
      if (editing) {
        await commentService.update(editing.id, payload);
        push("Comment updated");
      } else {
        await commentService.create(payload);
        push("Comment created");
      }
      setCreating(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  async function toggleApproved(comment: AdminComment) {
    try {
      await commentService.update(comment.id, { is_approved: !comment.is_approved });
      push(comment.is_approved ? "Comment hidden" : "Comment approved");
      await load();
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  const targetOptions =
    form.target_type === "article"
      ? articles.map((item) => ({ id: item.id, label: item.title }))
      : galleryWorks.map((item) => ({
          id: item.id,
          label: `${item.title} (${item.type})`,
        }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Engagement</p>
          <h1 className="font-display text-3xl sm:text-4xl">Comments</h1>
        </div>
        <Button onClick={openCreate}>Add comment</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input placeholder="Search author or body" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
        <Select value={targetType} onChange={(e) => { setPage(1); setTargetType(e.target.value); }}>
          <option value="">All targets</option>
          <option value="article">Journal</option>
          <option value="gallery_work">Gallery</option>
        </Select>
        <Select value={approved} onChange={(e) => { setPage(1); setApproved(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="1">Approved</option>
          <option value="0">Hidden</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-ink-800 dark:bg-ink-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-[0.16em] text-zinc-500 dark:border-ink-800">
            <tr>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Comment</th>
              <th className="px-4 py-3 font-medium">On</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">No comments yet.</td>
              </tr>
            ) : (
              items.map((comment) => (
                <tr key={comment.id} className="border-t border-zinc-100 align-top dark:border-ink-800">
                  <td className="px-4 py-3">
                    <p className="font-medium">{comment.author_name}</p>
                    <p className="text-xs text-zinc-500">{comment.author_email || "—"}</p>
                    <p className="mt-1 text-xs text-zinc-400">{formatRelative(comment.created_at)}</p>
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <p className="line-clamp-3 whitespace-pre-wrap text-ink-800 dark:text-paper-100/85">{comment.body}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                      {comment.target_type === "article" ? "Journal" : "Gallery"}
                    </p>
                    {comment.target_url ? (
                      <a href={comment.target_url} target="_blank" rel="noreferrer" className="mt-1 block text-sm hover:text-rust-600">
                        {comment.target_title || `#${comment.target_id}`}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm">{comment.target_title || `#${comment.target_id}`}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={comment.is_approved ? "published" : "archived"}>
                      {comment.is_approved ? "Approved" : "Hidden"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="text-sm font-medium hover:text-rust-600" onClick={() => openEdit(comment)}>
                        Edit
                      </button>
                      <button type="button" className="text-sm font-medium hover:text-rust-600" onClick={() => toggleApproved(comment)}>
                        {comment.is_approved ? "Hide" : "Approve"}
                      </button>
                      <button type="button" className="text-sm font-medium text-red-600" onClick={() => setPendingDelete(comment)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} lastPage={lastPage} onChange={setPage} />

      <Modal
        open={creating || !!editing}
        title={editing ? "Edit comment" : "Add comment"}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        className="max-w-2xl"
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Target type">
              <Select
                value={form.target_type}
                onChange={(e) => setForm({ ...form, target_type: e.target.value as "article" | "gallery_work", target_id: "" })}
              >
                <option value="article">Journal article</option>
                <option value="gallery_work">Gallery work</option>
              </Select>
            </Field>
            <Field label="Target">
              <Select
                value={form.target_id}
                onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                required
              >
                <option value="">Select…</option>
                {targetOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Author name">
              <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} required maxLength={120} />
            </Field>
            <Field label="Author email">
              <Input type="email" value={form.author_email} onChange={(e) => setForm({ ...form, author_email: e.target.value })} maxLength={180} />
            </Field>
          </div>
          <Field label="Body">
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required maxLength={5000} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_approved}
              onChange={(e) => setForm({ ...form, is_approved: e.target.checked })}
            />
            Approved / visible on site
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Create comment"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete comment"
        message="This permanently removes the comment from the site."
        confirmLabel="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await commentService.destroy(pendingDelete.id);
            push("Comment deleted");
            setPendingDelete(null);
            await load();
          } catch (error) {
            push(getErrorMessage(error), "error");
          }
        }}
      />
    </div>
  );
}
