import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { publicService } from "../../services/public";
import type { Article, Paginated } from "../../types";
import { ArticleCard } from "../../components/article/ArticleCard";
import { PageBackLink } from "../../components/nav/PageBackLink";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<(Paginated<Article> & { query: string }) | null>(null);

  useEffect(() => {
    const term = params.get("q") || "";
    setQ(term);
    if (!term) {
      setResult({ query: "", items: [], meta: { current_page: 1, last_page: 1, per_page: 12, total: 0 } });
      return;
    }
    publicService.search(term, page).then(setResult);
  }, [params, page]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setParams({ q });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex flex-wrap gap-3">
        <PageBackLink to="/" label="Back to Home" />
        <PageBackLink to="/blog" label="Journal" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">Search</h1>
      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titles, excerpts, tags, desks" />
        <Button type="submit">Search</Button>
      </form>
      {!result || result.items.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No matches" body="Try a language, a desk, or a sharper noun." />
        </div>
      ) : (
        <div className="display-card-grid mt-10">
          {result.items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      {result ? <Pagination page={result.meta.current_page} lastPage={result.meta.last_page} onChange={setPage} /> : null}
    </div>
  );
}
