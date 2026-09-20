import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicService } from "../../services/public";
import type { Article, Paginated } from "../../types";
import { ArticleCard } from "../../components/article/ArticleCard";
import { PageBackLink } from "../../components/nav/PageBackLink";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";

export function TaxonomyPage({ kind }: { kind: "category" | "tag" | "author" }) {
  const { slug = "" } = useParams();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Article[]>([]);
  const [meta, setMeta] = useState<Paginated<Article>["meta"] | null>(null);

  useEffect(() => {
    setPage(1);
  }, [slug, kind]);

  useEffect(() => {
    const load = async () => {
      if (kind === "category") {
        const data = await publicService.category(slug, page);
        setTitle(data.category.name);
        setBody(data.category.description || "");
        setItems(data.items);
        setMeta(data.meta);
      } else if (kind === "tag") {
        const data = await publicService.tag(slug, page);
        setTitle(`#${data.tag.name}`);
        setBody("Stories collected under this tag.");
        setItems(data.items);
        setMeta(data.meta);
      } else {
        const data = await publicService.author(slug, page);
        setTitle(data.author.name);
        setBody(data.author.bio || "");
        setItems(data.items);
        setMeta(data.meta);
      }
    };
    load();
  }, [kind, slug, page]);

  if (!meta) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-wrap gap-3">
        <PageBackLink to="/blog" label="Back to Journal" />
        <PageBackLink to="/" label="Home" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-ink-700 dark:text-paper-100/70">{body}</p>
      <div className="display-card-grid mt-10">
        {items.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <Pagination page={meta.current_page} lastPage={meta.last_page} onChange={setPage} />
    </div>
  );
}
