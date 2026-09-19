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
import { Card } from "../../components/ui/Card";

const emptyArticle: Partial<Article> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
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
  const [saving, setSaving] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const stats = useMemo(() => textStats(article.content), [article.content]);

  useEffect(() => {
    taxonomyService.categories().then(setCategories);
    taxonomyService.tags().then(setTags);
    if (id) {
      articleService.get(Number(id)).then((data) => {
        setArticle(data);
        setSelectedTags(data.tags?.map((tag) => tag.id) || []);
        setScheduleAt(data.scheduled_at ? data.scheduled_at.slice(0, 16) : "");
      });
      articleService.revisions(Number(id)).then(setRevisions);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timer = window.setTimeout(() => {
      if (article.title) save("draft", true);
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [article, id]);

  function payload(status = article.status) {
    return {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      category_id: article.category?.id || (article as { category_id?: number }).category_id || null,
      featured_image_id: article.featured_image?.id || null,
      tag_ids: selectedTags,
      status,
      scheduled_at: scheduleAt || null,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      canonical_url: article.canonical_url,
      og_title: article.og_title,
      og_description: article.og_description,
      twitter_card: article.twitter_card,
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
          <h1 className="font-display text-4xl">{id ? "Edit article" : "Create article"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => save("draft")} disabled={saving}>Save draft</Button>
          {article.slug ? <a className="rounded-full border px-4 py-2 text-sm" href={`/blog/${article.slug}`} target="_blank" rel="noreferrer">Preview</a> : null}
          <Button variant="outline" onClick={schedule}>Schedule</Button>
          <Button variant="rust" onClick={publish}>Publish</Button>
          {id ? <Button variant="ghost" onClick={() => articleService.archive(Number(id)).then((saved) => { setArticle(saved); push("Archived"); })}>Archive</Button> : null}
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Field label="Title">
            <Input value={article.title || ""} onChange={(e) => setArticle({ ...article, title: e.target.value })} />
          </Field>
          <Field label="Slug">
            <Input value={article.slug || ""} onChange={(e) => setArticle({ ...article, slug: e.target.value })} />
          </Field>
          <RichTextEditor value={article.content || ""} onChange={(content) => setArticle((current) => ({ ...current, content }))} />
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
            <p className="mb-3 text-sm font-medium">SEO</p>
            <SEOForm value={article} onChange={(patch) => setArticle({ ...article, ...patch })} />
          </Card>
          <Card>
            <Field label="Excerpt">
              <Textarea value={article.excerpt || ""} onChange={(e) => setArticle({ ...article, excerpt: e.target.value })} />
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
    </div>
  );
}
