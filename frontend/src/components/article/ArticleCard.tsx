import { Link } from "react-router-dom";
import type { Article } from "../../types";
import { formatDate, readingLabel } from "../../utils/format";

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  return (
    <article className={featured ? "grid gap-6 lg:grid-cols-2" : "space-y-3"}>
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
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-rust-600">
          {article.category?.name || "Notebook"} · {readingLabel(article.reading_time)}
        </p>
        <h3 className={featured ? "font-display text-4xl leading-tight" : "font-display text-2xl leading-tight"}>
          <Link to={`/blog/${article.slug}`} className="hover:text-rust-600">
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700 dark:text-paper-100/75">{article.excerpt}</p>
        <p className="mt-3 text-xs text-ink-700/70">
          {article.author?.name} · {formatDate(article.published_at)}
        </p>
      </div>
    </article>
  );
}
