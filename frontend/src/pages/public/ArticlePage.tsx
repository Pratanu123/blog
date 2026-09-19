import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { publicService } from "../../services/public";
import type { Article } from "../../types";
import { formatDate, readingLabel } from "../../utils/format";
import { ArticleCard } from "../../components/article/ArticleCard";
import { JsonLd } from "../../components/seo/JsonLd";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";

export function ArticlePage() {
  const { slug = "" } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    publicService.article(slug).then(setArticle).catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    if (!article) return;
    document.title = article.meta_title || article.title;
    const meta = document.querySelector('meta[name="description"]') || Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute("content", article.meta_description || article.excerpt || "");
    document.head.appendChild(meta);
  }, [article]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Story not found" body="This piece is unpublished or the slug has changed." /></div>;
  if (!article) return <Spinner />;

  const share = encodeURIComponent(window.location.href);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title,
            datePublished: article.published_at,
            author: { "@type": "Person", name: article.author?.name },
            image: article.featured_image?.url,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Journal", item: "/blog" },
              { "@type": "ListItem", position: 3, name: article.title },
            ],
          },
        ]}
      />
      <nav className="text-sm text-ink-700/70">
        <Link to="/">Home</Link> / <Link to="/blog">Journal</Link>
        {article.category ? <> / <Link to={`/category/${article.category.slug}`}>{article.category.name}</Link></> : null}
      </nav>
      <p className="mt-6 text-xs uppercase tracking-[0.22em] text-rust-600">
        {article.category?.name} · {readingLabel(article.reading_time)}
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95]">{article.title}</h1>
      <p className="mt-4 text-sm">
        <Link to={`/author/${article.author?.slug}`} className="hover:text-rust-600">{article.author?.name}</Link>
        {" · "}
        {formatDate(article.published_at)}
      </p>
      {article.featured_image?.url ? (
        <img src={article.featured_image.url} alt={article.featured_image.alt_text || article.title} className="my-8 w-full rounded-[1.8rem] object-cover" />
      ) : null}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: article.content || "" }} />
      <div className="mt-8 flex flex-wrap gap-2">
        {article.tags?.map((tag) => (
          <Link key={tag.id} to={`/tag/${tag.slug}`} className="rounded-full bg-ink-100 px-3 py-1 text-xs dark:bg-ink-800">
            #{tag.name}
          </Link>
        ))}
      </div>
      <div className="mt-8 flex gap-3 text-sm">
        <a href={`https://twitter.com/intent/tweet?url=${share}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noreferrer">Share on X</a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${share}`} target="_blank" rel="noreferrer">LinkedIn</a>
      </div>
      <section className="mt-12 rounded-[1.8rem] bg-ink-900 p-6 text-paper-50">
        <p className="text-xs uppercase tracking-[0.2em] text-rust-400">Author</p>
        <h2 className="mt-2 font-display text-3xl">{article.author?.name}</h2>
        <p className="mt-2 text-sm text-paper-100/70">{article.author?.bio}</p>
      </section>
      <section className="mt-12">
        <h2 className="font-display text-3xl">Related</h2>
        <div className="mt-6 space-y-8">
          {article.related?.map((item) => (
            <ArticleCard key={item.id} article={item} />
          ))}
        </div>
      </section>
      <section className="mt-12 rounded-[1.8rem] border border-dashed border-ink-200 p-6 dark:border-ink-700">
        <h2 className="font-display text-2xl">Comments</h2>
        <p className="mt-2 text-sm text-ink-700/70">A comments system will land in a later issue. For now, write to the newsroom.</p>
      </section>
    </article>
  );
}
