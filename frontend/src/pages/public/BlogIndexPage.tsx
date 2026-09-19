import { useEffect, useState } from "react";
import { publicService } from "../../services/public";
import type { Article, Paginated } from "../../types";
import { ArticleCard } from "../../components/article/ArticleCard";
import { Pagination } from "../../components/ui/Pagination";
import { Spinner } from "../../components/ui/Spinner";

export function BlogIndexPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Article> | null>(null);

  const leaves = Array.from({ length: 32 }, (_, i) => {
    const band = i % 4;
    const y =
      band === 0
        ? 3 + ((i * 11) % 20)
        : band === 1
          ? 26 + ((i * 13) % 20)
          : band === 2
            ? 50 + ((i * 17) % 18)
            : 72 + ((i * 7) % 22);

    return {
      id: i,
      pattern: (i % 4) + 1,
      tint: (i % 4) + 1,
      y,
      size: 1.35 + ((i * 5) % 6) * 0.18,
      delay: (i % 11) * 0.95,
      duration: 18 + (i % 7) * 3.2,
      drift: 8 + (i % 6) * 3.5,
      bob: 3.2 + (i % 5) * 0.7,
    };
  });

  useEffect(() => {
    publicService.articles(page).then(setData);
  }, [page]);

  if (!data) return <Spinner />;

  return (
    <div className="journal-stage">
      <div className="journal-wind-leaves" aria-hidden="true">
        {leaves.map((leaf) => (
          <span
            key={leaf.id}
            className={`journal-leaf journal-leaf--p${leaf.pattern} journal-leaf--t${leaf.tint}`}
            style={{
              top: `${leaf.y}%`,
              width: `${leaf.size}rem`,
              height: `${leaf.size * 0.62}rem`,
              animationDelay: `${leaf.delay}s`,
              animationDuration: `${leaf.duration}s`,
              ["--journal-leaf-drift" as string]: `${leaf.drift}vh`,
            }}
          >
            <span
              className="journal-leaf-sway"
              style={{
                animationDelay: `${leaf.delay * 0.3}s`,
                animationDuration: `${leaf.bob}s`,
              }}
            >
              <span className="journal-leaf-blade" />
              <span className="journal-leaf-vein" />
              <span className="journal-leaf-stem" />
            </span>
          </span>
        ))}
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-5xl">The journal</h1>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {data.items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} onChange={setPage} />
      </div>
    </div>
  );
}
