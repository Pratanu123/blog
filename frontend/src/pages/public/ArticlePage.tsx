import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { publicService } from "../../services/public";
import type { Article, SiteSettings } from "../../types";
import { formatDate, readingLabel } from "../../utils/format";
import { articleAuthorName } from "../../utils/articleAuthor";
import { trackEvent } from "../../utils/analytics";
import { ArticleCard } from "../../components/article/ArticleCard";
import { EngagementPanel } from "../../components/engagement/EngagementPanel";
import { JournalDragon } from "../../components/article/JournalDragon";
import { ShareBar } from "../../components/share/ShareBar";
import { JsonLd } from "../../components/seo/JsonLd";
import { DocumentHead } from "../../components/seo/DocumentHead";
import { Spinner } from "../../components/ui/Spinner";
import { PageBackLink } from "../../components/nav/PageBackLink";
import { EmptyState } from "../../components/ui/EmptyState";

export function ArticlePage() {
  const { slug = "" } = useParams();
  const { settings } = useOutletContext<{ settings: SiteSettings }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    publicService.article(slug).then(setArticle).catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    if (!article) return;
    trackEvent("journal_view", {
      content_type: "journal_article",
      content_id: article.slug,
      content_name: article.title,
      category: article.category?.name,
    });
  }, [article]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Story not found" body="This piece is unpublished or the slug has changed." /></div>;
  if (!article) return <Spinner />;

  const siteUrl = (settings.site_url || window.location.origin).replace(/\/$/, "");
  const pageUrl = `${siteUrl}/blog/${article.slug}`;
  const title = article.meta_title || article.title;
  const description = article.meta_description || article.excerpt || undefined;
  const image =
    article.og_image?.url ||
    article.featured_image?.url ||
    settings.default_og_image ||
    "/logos/ink-voltage-og-1200x630.png";

  return (
    <div className="article-stage mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-12">
      <DocumentHead
        title={`${title} · ${settings.site_name || "Ink & Voltage"}`}
        description={description}
        canonical={article.canonical_url || pageUrl}
        image={image}
        type="article"
        siteName={settings.site_name}
        siteUrl={settings.site_url}
        twitterHandle={settings.twitter_handle}
      />
      <JournalDragon />
      <article className="article-column relative z-[1] mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center gap-2 sm:mb-8 sm:gap-3">
          <PageBackLink to="/blog" label="Back to Journal" tone="fire" />
          <PageBackLink to="/" label="Home" tone="fire" />
        </div>
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: article.title,
              datePublished: article.published_at,
              author: { "@type": "Person", name: articleAuthorName(article) },
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
        <h1 className="mt-3 font-display text-3xl leading-[1.05] sm:text-4xl md:text-5xl md:leading-[0.95]">{article.title}</h1>
        <p className="mt-4 text-sm">
          {article.author?.slug ? (
            <Link to={`/author/${article.author.slug}`} className="hover:text-rust-600">{articleAuthorName(article)}</Link>
          ) : (
            <span>{articleAuthorName(article)}</span>
          )}
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
        <ShareBar
          url={pageUrl}
          title={article.title}
          contentType="journal_article"
          contentId={article.slug}
        />

        <EngagementPanel type="article" id={article.id} className="mt-12" />

        {article.related && article.related.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-3xl">Related</h2>
            <div className="display-card-grid mt-6">
              {article.related.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}
