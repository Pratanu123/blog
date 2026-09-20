import { Link } from "react-router-dom";
import type { Article } from "../../types";
import { formatDate, readingLabel } from "../../utils/format";
import { articleAuthorName } from "../../utils/articleAuthor";

function excerptPreview(text: string | null | undefined, max = 110): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "").trimEnd()}…`;
}

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  if (featured) {
    return (
      <article className="grid gap-6 lg:grid-cols-2">
        <Link to={`/blog/${article.slug}`} className="group block overflow-hidden rounded-[1.6rem] bg-ink-100">
          {article.featured_image?.url ? (
            <img
              src={article.featured_image.url}
              alt={article.featured_image.alt_text || article.title}
              className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-[16/10] items-end bg-gradient-to-br from-ink-900 via-ink-800 to-rust-600 p-6 text-paper-50">
              <p className="font-display text-3xl leading-none">{article.title.slice(0, 1)}</p>
            </div>
          )}
        </Link>
        <div className="px-1.5 sm:px-2">
          <p className="mb-2.5 text-xs uppercase tracking-[0.22em] text-rust-600">
            {article.category?.name || "Notebook"} · {readingLabel(article.reading_time)}
          </p>
          <h3 className="font-display text-4xl leading-snug">
            <Link to={`/blog/${article.slug}`} className="hover:text-rust-600">
              {article.title}
            </Link>
          </h3>
          <p className="mt-3.5 max-w-2xl text-sm leading-7 text-ink-700 dark:text-paper-100/80">{article.excerpt}</p>
          <p className="mt-4 text-xs text-ink-700/80 dark:text-paper-200/70">
            {articleAuthorName(article)} · {formatDate(article.published_at)}
          </p>
        </div>
      </article>
    );
  }

  const preview = excerptPreview(article.excerpt);

  return (
    <article className="display-card journal-post-card overflow-hidden">
      <Link to={`/blog/${article.slug}`} className="group display-card-media block overflow-hidden rounded-[1.1rem] bg-ink-100">
        {article.featured_image?.url ? (
          <img
            src={article.featured_image.url}
            alt={article.featured_image.alt_text || article.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-br from-ink-900 via-ink-800 to-rust-600 p-4 text-paper-50">
            <p className="font-display text-2xl leading-none">{article.title.slice(0, 1)}</p>
          </div>
        )}
      </Link>
      <div className="flex min-h-0 flex-1 flex-col px-1 pt-3">
        <p className="mb-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-rust-600">
          {article.category?.name || "Notebook"} · {readingLabel(article.reading_time)}
        </p>
        <h3 className="font-display text-xl leading-snug">
          <Link to={`/blog/${article.slug}`} className="line-clamp-2 hover:text-rust-600">
            {article.title}
          </Link>
        </h3>
        {preview ? (
          <p className="mt-2 text-sm leading-6 text-ink-700 dark:text-paper-100/80">
            {preview}{" "}
            <Link to={`/blog/${article.slug}`} className="font-medium text-rust-600 hover:underline">
              Read More
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6">
            <Link to={`/blog/${article.slug}`} className="font-medium text-rust-600 hover:underline">
              Read More
            </Link>
          </p>
        )}
        <p className="mt-3 text-xs text-ink-700/80 dark:text-paper-200/70">
          {articleAuthorName(article)} · {formatDate(article.published_at)}
        </p>
      </div>
    </article>
  );
}
