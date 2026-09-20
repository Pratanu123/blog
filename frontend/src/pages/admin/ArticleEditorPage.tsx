import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { articleService } from "../../services/articles";
import { taxonomyService } from "../../services/admin";
import type { Article, ArticleRevision, Category, MediaItem, Tag } from "../../types";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Input";
import { RichTextEditor } from "../../components/editor/RichTextEditor";
import { MediaPicker } from "../../components/media/MediaPicker";
import { SEOForm } from "../../components/seo/SEOForm";
import { textStats } from "../../utils/textStats";
import { slugify } from "../../utils/slugify";
import {
  buildOrganicSeoDefaults,
  seoDescriptionFromCopy,
  seoSlugFromTitle,
} from "../../utils/seo";
import { Card } from "../../components/ui/Card";

const emptyArticle: Partial<Article> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  author_name: "",
  status: "draft",
  twitter_card: "summary_large_image",
};

export function ArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [article, setArticle] = useState<Partial<Article>>(emptyArticle);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [revisions, setRevisions] = useState<ArticleRevision[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [editorSyncKey, setEditorSyncKey] = useState(0);
  const [seoManual, setSeoManual] = useState({
    meta_title: false,
    meta_description: false,
    og_title: false,
    og_description: false,
  });
  const stats = useMemo(() => textStats(article.content), [article.content]);

  useEffect(() => {
    taxonomyService.categories().then(setCategories);
    taxonomyService.tags().then(setTags);
    if (id) {
      articleService.get(Number(id)).then((data) => {
        setArticle(data);
        setSelectedTags(data.tags?.map((tag) => tag.id) || []);
        setScheduleAt(data.scheduled_at ? data.scheduled_at.slice(0, 16) : "");
        setSlugManual(Boolean(data.slug));
        setSeoManual({
          meta_title: Boolean(data.meta_title),
          meta_description: Boolean(data.meta_description),
          og_title: Boolean(data.og_title),
          og_description: Boolean(data.og_description),
        });
      });
      articleService.revisions(Number(id)).then(setRevisions);
    } else {
      setArticle(emptyArticle);
      setSelectedTags([]);
      setScheduleAt("");
      setSlugManual(false);
      setSeoManual({
        meta_title: false,
        meta_description: false,
        og_title: false,
        og_description: false,
      });
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timer = window.setTimeout(() => {
      if (article.title) save("draft", true);
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [article, id]);

  function applyOrganicDefaults(current: Partial<Article>, title: string, excerpt?: string | null) {
    const defaults = buildOrganicSeoDefaults({
      title,
      excerpt: excerpt ?? current.excerpt,
      content: current.content,
    });

    return {
      ...current,
      title,
      slug: slugManual ? current.slug : defaults.slug,
      meta_title: seoManual.meta_title ? current.meta_title : defaults.meta_title,
      meta_description: seoManual.meta_description ? current.meta_description : defaults.meta_description,
      og_title: seoManual.og_title ? current.og_title : defaults.og_title,
      og_description: seoManual.og_description ? current.og_description : defaults.og_description,
    } satisfies Partial<Article>;
  }

  function onTitleChange(title: string) {
    setArticle((current) => applyOrganicDefaults(current, title));
  }

  function onExcerptChange(excerpt: string) {
    setArticle((current) => {
      const next = { ...current, excerpt };
      if (!seoManual.meta_description) {
        next.meta_description = seoDescriptionFromCopy(excerpt, current.content);
      }
      if (!seoManual.og_description) {
        next.og_description = seoDescriptionFromCopy(excerpt, current.content);
      }
      return next;
    });
  }

  function onSlugChange(raw: string) {
    setSlugManual(true);
    const cleaned = slugify(raw, 160);
    setArticle((current) => ({ ...current, slug: cleaned || raw.toLowerCase().replace(/\s+/g, "-") }));
  }

  function syncSlugFromTitle() {
    setSlugManual(false);
    setArticle((current) => ({
      ...current,
      slug: seoSlugFromTitle(current.title || ""),
    }));
  }

  function onSeoChange(patch: Partial<Article>) {
    setSeoManual((current) => ({
      meta_title: current.meta_title || patch.meta_title !== undefined,
      meta_description: current.meta_description || patch.meta_description !== undefined,
      og_title: current.og_title || patch.og_title !== undefined,
      og_description: current.og_description || patch.og_description !== undefined,
    }));
    setArticle((current) => ({ ...current, ...patch }));
  }

  function payload(status = article.status) {
    const defaults = buildOrganicSeoDefaults({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
    });

    return {
      title: article.title,
      slug: article.slug || defaults.slug,
      excerpt: article.excerpt,
      content: article.content,
      author_name: article.author_name || null,
      category_id: article.category?.id || (article as { category_id?: number }).category_id || null,
      featured_image_id: article.featured_image?.id || null,
      tag_ids: selectedTags,
      status,
      scheduled_at: scheduleAt || null,
      meta_title: article.meta_title || defaults.meta_title,
      meta_description: article.meta_description || defaults.meta_description,
      canonical_url: article.canonical_url,
      og_title: article.og_title || defaults.og_title,
      og_description: article.og_description || defaults.og_description,
      twitter_card: article.twitter_card || "summary_large_image",
    };
  }

  async function save(status = article.status, silent = false) {
    setSaving(true);
    try {
      const saved = await articleService.save(payload(status), id ? Number(id) : undefined);
      setArticle(saved);
      if (!id) navigate(`/admin/articles/${saved.id}`, { replace: true });
      if (!silent) push("Article saved");
    } catch (error) {
      push(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!id) {
      await save("published");
      return;
    }
    try {
      const saved = await articleService.publish(Number(id));
      setArticle(saved);
      push("Published");
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  async function schedule() {
    if (!id || !scheduleAt) {
      push("Save the article and choose a schedule time first.", "info");
      return;
    }
    try {
      const saved = await articleService.schedule(Number(id), new Date(scheduleAt).toISOString());
      setArticle(saved);
      push("Scheduled");
    } catch (error) {
      push(getErrorMessage(error), "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{id ? "Edit" : "Create"}</p>
          <h1 className="font-display text-3xl sm:text-4xl">{id ? "Edit article" : "Create article"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/blog"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-ink-200 px-4 py-2 text-sm font-medium hover:border-rust-500 hover:text-rust-600 dark:border-ink-700"
          >
            View Journal
          </a>
          {article.slug && article.status === "published" ? (
            <a
              href={`/blog/${article.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-ink-200 px-4 py-2 text-sm font-medium hover:border-rust-500 hover:text-rust-600 dark:border-ink-700"
            >
              Open live post
            </a>
          ) : null}
          <Button variant="outline" onClick={() => save("draft")} disabled={saving}>Save draft</Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>Preview</Button>
          <Button variant="outline" onClick={schedule}>Schedule</Button>
          <Button variant="rust" onClick={publish}>Publish</Button>
          {id ? (
            article.status === "archived" ? (
              <Button
                variant="ghost"
                onClick={() => articleService.unarchive(Number(id)).then((saved) => { setArticle(saved); push("Unarchived"); })}
              >
                Unarchive
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => articleService.archive(Number(id)).then((saved) => { setArticle(saved); push("Archived"); })}
              >
                Archive
              </Button>
            )
          ) : null}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Field label="Title">
            <Input value={article.title || ""} onChange={(e) => onTitleChange(e.target.value)} />
          </Field>
          <Field label="Author name" hint="Bylines shown on the public article. Leave blank to use your account name.">
            <Input
              value={article.author_name || ""}
              onChange={(e) => setArticle((current) => ({ ...current, author_name: e.target.value }))}
              placeholder="Joyeeta"
            />
          </Field>
          <Field
            label="SEO slug"
            hint={
              slugManual
                ? "Custom URL — keep the full topic readable for searchers and crawlers."
                : "Auto-built from your full title: clean, readable, and SEO-friendly without dropping meaning."
            }
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={article.slug || ""}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="full-title-as-seo-slug"
                className="font-mono text-sm"
              />
              {slugManual ? (
                <Button type="button" variant="ghost" onClick={syncSlugFromTitle}>
                  Use title
                </Button>
              ) : null}
            </div>
            {article.slug ? (
              <p className="mt-1.5 text-xs text-zinc-500">
                Organic URL: <span className="font-mono text-rust-600">/blog/{article.slug}</span>
              </p>
            ) : null}
          </Field>
          <RichTextEditor
            value={article.content || ""}
            syncKey={editorSyncKey}
            onChange={(content) => setArticle((current) => ({ ...current, content }))}
          />
          <p className="text-xs text-zinc-500">{stats.words} words · {stats.characters} characters · {stats.readingTime} min read</p>
        </div>
        <aside className="space-y-4">
          <Card>
            <Field label="Status">
              <Select value={article.status || "draft"} onChange={(e) => setArticle({ ...article, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
            <div className="mt-3">
              <Field label="Schedule at">
                <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
              </Field>
            </div>
          </Card>
          <Card>
            <Field label="Category">
              <Select
                value={article.category?.id || ""}
                onChange={(e) => setArticle({ ...article, category: categories.find((category) => String(category.id) === e.target.value) })}
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </Field>
          </Card>
          <Card>
            <p className="mb-2 text-sm font-medium">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label key={tag.id} className="text-sm">
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => setSelectedTags((current) => e.target.checked ? [...current, tag.id] : current.filter((id) => id !== tag.id))}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-2 text-sm font-medium">Featured image</p>
            {article.featured_image?.url ? (
              <img
                src={article.featured_image.url}
                alt={article.featured_image.alt_text || article.title || "Featured image"}
                className="mb-3 max-h-48 w-full rounded-2xl object-cover"
              />
            ) : (
              <p className="mb-3 text-xs text-zinc-500">No featured image selected yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPickerOpen(true)}>
                {article.featured_image ? "Change image" : "Select image"}
              </Button>
              {article.featured_image ? (
                <Button
                  variant="ghost"
                  onClick={() => setArticle((current) => ({ ...current, featured_image: null }))}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </Card>
          <Card>
            <p className="mb-3 text-sm font-medium">SEO for organic reach</p>
            <SEOForm value={article} onChange={onSeoChange} />
          </Card>
          <Card>
            <Field label="Excerpt" hint="Also feeds the meta description when SEO fields are still auto-managed.">
              <Textarea value={article.excerpt || ""} onChange={(e) => onExcerptChange(e.target.value)} />
            </Field>
          </Card>
          {revisions.length > 0 ? (
            <Card>
              <p className="mb-3 text-sm font-medium">Revisions</p>
              <div className="space-y-2 text-sm">
                {revisions.map((revision) => (
                  <div key={revision.id} className="flex items-center justify-between gap-2">
                    <span>#{revision.revision_number} · {revision.title}</span>
                    <Button
                      variant="ghost"
                      onClick={() => articleService.restoreRevision(Number(id), revision.id).then((saved) => {
                        setArticle(saved);
                        setEditorSyncKey((key) => key + 1);
                        push("Revision restored");
                      })}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media: MediaItem) => {
          setArticle((current) => ({ ...current, featured_image: media }));
          push("Featured image selected — save the article to keep it.");
        }}
      />
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="my-6 w-full max-w-3xl rounded-[1.75rem] border border-ink-200 bg-paper-50 shadow-2xl dark:border-ink-700 dark:bg-ink-900">
            <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-5 py-4 dark:border-ink-700">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-zinc-500">Draft preview</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">Live view of the current editor — drafts do not need to be published.</p>
              </div>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            </div>
            <article className="min-w-0 space-y-5 overflow-x-hidden px-5 py-6 sm:px-8">
              {article.featured_image?.url ? (
                <img
                  src={article.featured_image.url}
                  alt={article.featured_image.alt_text || article.title || "Featured image"}
                  className="max-h-80 w-full rounded-[1.5rem] object-cover"
                />
              ) : null}
              <h1 className="break-words font-display text-3xl sm:text-4xl leading-tight text-ink-900 dark:text-paper-50">
                {article.title || "Untitled article"}
              </h1>
              {article.excerpt ? (
                <p className="break-words text-lg leading-8 text-zinc-600 dark:text-zinc-300">{article.excerpt}</p>
              ) : null}
              {article.content ? (
                <div className="article-body min-w-0 overflow-x-hidden" dangerouslySetInnerHTML={{ __html: article.content }} />
              ) : (
                <p className="text-sm text-zinc-500">Nothing in the body yet — write in the editor, then preview again.</p>
              )}
            </article>
          </div>
        </div>
      ) : null}
    </div>
  );
}
