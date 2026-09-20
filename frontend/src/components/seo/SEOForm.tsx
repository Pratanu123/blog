import type { Article } from "../../types";
import { Field, Input, Select, Textarea } from "../ui/Input";
import { Button } from "../ui/Button";
import { buildOrganicSeoDefaults, seoCharTone } from "../../utils/seo";

function CountHint({
  length,
  idealMin,
  idealMax,
  hardMax,
  label,
}: {
  length: number;
  idealMin: number;
  idealMax: number;
  hardMax: number;
  label: string;
}) {
  const tone = seoCharTone(length, idealMin, idealMax, hardMax);
  const color =
    tone === "good"
      ? "text-emerald-600"
      : tone === "short"
        ? "text-zinc-500"
        : tone === "long"
          ? "text-amber-600"
          : "text-red-600";

  return (
    <span className={`text-xs ${color}`}>
      {length}/{hardMax} · {label}
    </span>
  );
}

export function SEOForm({
  value,
  onChange,
}: {
  value: Partial<Article>;
  onChange: (patch: Partial<Article>) => void;
}) {
  const metaTitle = value.meta_title || "";
  const metaDescription = value.meta_description || "";
  const previewTitle = metaTitle || value.title || "Untitled article";
  const previewDesc =
    metaDescription ||
    "Add a meta description that answers the searcher’s intent and earns the click.";
  const previewPath = value.slug ? `/blog/${value.slug}` : "/blog/your-seo-slug";

  function refillFromArticle() {
    const defaults = buildOrganicSeoDefaults({
      title: value.title,
      excerpt: value.excerpt,
      content: value.content,
    });
    onChange({
      meta_title: defaults.meta_title,
      meta_description: defaults.meta_description,
      og_title: defaults.og_title,
      og_description: defaults.og_description,
      twitter_card: value.twitter_card || "summary_large_image",
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-ink-200/70 bg-white p-3 dark:border-ink-700 dark:bg-ink-950/60">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-zinc-500">Search preview</p>
        <p className="mt-2 truncate text-sm text-[#1a0dab] dark:text-[#8ab4f8]">{previewTitle}</p>
        <p className="truncate text-xs text-emerald-700 dark:text-emerald-400">inkandvoltage.example{previewPath}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{previewDesc}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs leading-5 text-zinc-500">
          Tuned for organic click-through: clear title, intent-led description, shareable social copy.
        </p>
        <Button type="button" variant="ghost" onClick={refillFromArticle}>
          Auto-fill
        </Button>
      </div>

      <Field
        label="SEO title"
        hint="Aim for 50–60 characters. Put the main keyword near the front."
      >
        <Input
          value={metaTitle}
          onChange={(e) => onChange({ meta_title: e.target.value.slice(0, 70) })}
          maxLength={70}
          placeholder="Keyword-led title for Google results"
        />
        <div className="mt-1">
          <CountHint length={metaTitle.length} idealMin={50} idealMax={60} hardMax={70} label="ideal 50–60" />
        </div>
      </Field>

      <Field
        label="Meta description"
        hint="Aim for 150–160 characters. Promise the value of the piece in one breath."
      >
        <Textarea
          value={metaDescription}
          onChange={(e) => onChange({ meta_description: e.target.value.slice(0, 180) })}
          maxLength={180}
          placeholder="A crisp summary that earns the organic click"
        />
        <div className="mt-1">
          <CountHint length={metaDescription.length} idealMin={140} idealMax={160} hardMax={180} label="ideal 150–160" />
        </div>
      </Field>

      <Field label="Canonical URL" hint="Leave blank to use this article URL. Set only when consolidating duplicate pages.">
        <Input
          value={value.canonical_url || ""}
          onChange={(e) => onChange({ canonical_url: e.target.value })}
          placeholder="https://yoursite.com/blog/preferred-url"
        />
      </Field>

      <Field label="Open Graph title" hint="Used when the piece is shared — keeps discovery traffic on-brand.">
        <Input
          value={value.og_title || ""}
          onChange={(e) => onChange({ og_title: e.target.value })}
          placeholder="Social headline"
        />
      </Field>

      <Field label="Open Graph description">
        <Textarea
          value={value.og_description || ""}
          onChange={(e) => onChange({ og_description: e.target.value })}
          placeholder="Social snippet"
        />
      </Field>

      <Field label="Twitter card">
        <Select
          value={value.twitter_card || "summary_large_image"}
          onChange={(e) => onChange({ twitter_card: e.target.value })}
        >
          <option value="summary_large_image">Summary large image</option>
          <option value="summary">Summary</option>
        </Select>
      </Field>
    </div>
  );
}
