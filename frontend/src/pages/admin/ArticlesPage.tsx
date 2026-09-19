import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { articleService } from "../../services/articles";
import { taxonomyService } from "../../services/admin";
import type { Article, Category } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Input, Select } from "../../components/ui/Input";
import { Pagination } from "../../components/ui/Pagination";
import { formatDate, formatNumber, formatRelative } from "../../utils/format";
import { useDebounce } from "../../hooks/useDebounce";

export function ArticlesPage() {
  const { push } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);
  const debouncedSearch = useDebounce(search);

  async function load() {
    const result = await articleService.list({
      page,
      search: debouncedSearch,
      status,
      category_id: categoryId || undefined,
    });
    setItems(result.items);
    setLastPage(result.meta.last_page);
  }

  useEffect(() => {
    taxonomyService.categories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    load().catch((error) => push(getErrorMessage(error), "error"));
  }, [page, debouncedSearch, status, categoryId]);

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      push(message);
      await load();
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Content</p>
          <h1 className="font-display text-4xl">Articles</h1>
        </div>
        <Link to="/admin/articles/new" className="rounded-full bg-ink-900 px-4 py-2 text-center text-sm text-white dark:bg-paper-50 dark:text-ink-900">
          Create article
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Input placeholder="Search title or excerpt" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
        <Select
          value=""
          onChange={(e) => {
            const action = e.target.value;
            if (!action || selected.length === 0) return;
            run(() => articleService.bulk(action, selected), "Bulk action completed");
            setSelected([]);
          }}
        >
          <option value="">Bulk actions</option>
          <option value="publish">Publish</option>
          <option value="archive">Archive</option>
          <option value="delete">Delete</option>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-ink-800 dark:bg-ink-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-ink-800">
            <tr>
              <th className="p-3"><input type="checkbox" aria-label="Select all" onChange={(e) => setSelected(e.target.checked ? items.map((item) => item.id) : [])} /></th>
              <th className="p-3">Title</th>
              <th className="p-3">Author</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Published</th>
              <th className="p-3">Views</th>
              <th className="p-3">Updated</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((article) => (
              <tr key={article.id} className="border-b border-zinc-100 dark:border-ink-800">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(article.id)}
                    onChange={(e) => setSelected((current) => e.target.checked ? [...current, article.id] : current.filter((id) => id !== article.id))}
                  />
                </td>
                <td className="p-3 font-medium">{article.title}</td>
                <td className="p-3">{article.author?.name}</td>
                <td className="p-3">{article.category?.name || "—"}</td>
                <td className="p-3"><Badge tone={article.status}>{article.status}</Badge></td>
                <td className="p-3">{formatDate(article.published_at)}</td>
                <td className="p-3">{formatNumber(article.views)}</td>
                <td className="p-3">{formatRelative(article.updated_at)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" onClick={() => navigate(`/admin/articles/${article.id}`)}>Edit</Button>
                    <a className="rounded-full px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-ink-800" href={`/blog/${article.slug}`} target="_blank" rel="noreferrer">Preview</a>
                    <Button variant="ghost" onClick={() => run(() => articleService.duplicate(article.id), "Duplicated")}>Duplicate</Button>
                    <Button variant="ghost" onClick={() => run(() => articleService.publish(article.id), "Published")}>Publish</Button>
                    <Button variant="ghost" onClick={() => run(() => articleService.archive(article.id), "Archived")}>Archive</Button>
                    <Button variant="ghost" onClick={() => setPendingDelete(article)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} lastPage={lastPage} onChange={setPage} />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete article"
        message={`Delete “${pendingDelete?.title}”? This can be recovered from the database as a soft delete.`}
        confirmLabel="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) run(() => articleService.destroy(pendingDelete.id), "Deleted");
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
