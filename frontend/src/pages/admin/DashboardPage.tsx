import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardService } from "../../services/admin";
import { getErrorMessage } from "../../services/api";
import type { Article, DashboardStats } from "../../types";
import { Card } from "../../components/ui/Card";
import { formatNumber } from "../../utils/format";
import { Spinner } from "../../components/ui/Spinner";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [views, setViews] = useState<{ date: string; views: number }[]>([]);
  const [published, setPublished] = useState<{ date: string; articles: number }[]>([]);
  const [top, setTop] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    dashboardService
      .overview()
      .then((data) => {
        if (cancelled) return;
        setStats(data.stats);
        setViews(data.views);
        setPublished(data.published);
        setTop(data.top);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Could not load the dashboard"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner />;

  if (error || !stats) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-ink-800 dark:bg-ink-900">
        <p className="font-display text-2xl">Dashboard unavailable</p>
        <p className="mt-2 text-sm text-zinc-500">{error ?? "Stats could not be loaded."}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-ink-900 px-4 py-2 text-sm text-white dark:bg-paper-50 dark:text-ink-900"
        >
          Try again
        </button>
      </div>
    );
  }

  const cards = [
    ["Total articles", stats.total_articles],
    ["Published", stats.published_articles],
    ["Drafts", stats.draft_articles],
    ["Scheduled", stats.scheduled_articles],
    ["Total views", stats.total_views],
    ["Authors", stats.total_authors],
    ["Categories", stats.categories],
    ["Tags", stats.tags],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Overview</p>
          <h1 className="font-display text-4xl">Dashboard</h1>
        </div>
        <Link to="/admin/articles/new" className="rounded-full bg-ink-900 px-4 py-2 text-sm text-white dark:bg-paper-50 dark:text-ink-900">
          New article
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
            <p className="mt-2 font-display text-4xl">{formatNumber(value)}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-medium">Views over time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={views}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#c45c26" fill="#c45c26" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-medium">Articles published</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={published}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="articles" stroke="#161310" fill="#161310" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="mb-4 font-medium">Top articles</h2>
        <div className="space-y-3">
          {top.map((article) => (
            <div key={article.id} className="flex items-center justify-between gap-4 text-sm">
              <Link to={`/admin/articles/${article.id}`} className="hover:text-rust-600">{article.title}</Link>
              <span className="text-zinc-500">{formatNumber(article.views)} views</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
