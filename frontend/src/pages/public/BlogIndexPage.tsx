import { useEffect, useState } from "react";
import { publicService } from "../../services/public";
import type { Article, Paginated } from "../../types";
import { ArticleCard } from "../../components/article/ArticleCard";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";

export function BlogIndexPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Article> | null>(null);

  useEffect(() => {
    publicService.articles(page).then(setData);
  }, [page]);

  if (!data) return <Spinner />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl">The journal</h1>
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {data.items.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} onChange={setPage} />
    </div>
  );
}
