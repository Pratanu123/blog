import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardService } from "../../services/admin";
import { getErrorMessage } from "../../services/api";
import type { Article, DashboardStats } from "../../types";
import { Card } from "../../components/ui/Card";
import { formatNumber } from "../../utils/format";
import { Spinner } from "../../components/ui/Spinner";
import { articleAuthorName } from "../../utils/articleAuthor";

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function Insight({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink-200/80 bg-paper-50/80 p-4 dark:border-ink-700 dark:bg-ink-950/40">
      <p className="text-sm font-medium text-ink-900 dark:text-paper-50">{title}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{body}</p>
    </div>
  );
}

export function AnalyticsPage() {
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
        if (!cancelled) setError(getErrorMessage(err, "Could not load analytics"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const viewChart = useMemo(
    () => views.map((row) => ({ ...row, label: shortDate(row.date) })),
    [views],
  );
  const publishChart = useMemo(
    () => published.map((row) => ({ ...row, label: shortDate(row.date) })),
    [published],
  );

  const summary = useMemo(() => {
    if (!stats) return null;
    const last7 = views.slice(-7);
    const prev7 = views.slice(-14, -7);
    const recentViews = last7.reduce((sum, row) => sum + row.views, 0);
    const previousViews = prev7.reduce((sum, row) => sum + row.views, 0);
    const dailyAvg = average(last7.map((row) => row.views));
    const changePct =
      previousViews === 0
        ? recentViews > 0
          ? 100
          : 0
        : Math.round(((recentViews - previousViews) / previousViews) * 100);
    const publishedShare =
      stats.total_articles === 0
        ? 0
        : Math.round((stats.published_articles / stats.total_articles) * 100);
    const bestDay = [...views].sort((a, b) => b.views - a.views)[0];
    const topArticle = top[0];

    return {
      recentViews,
      previousViews,
      dailyAvg,
      changePct,
      publishedShare,
      bestDay,
      topArticle,
      draftsWaiting: stats.draft_articles,
      scheduledWaiting: stats.scheduled_articles,
    };
  }, [stats, views, top]);

  if (loading) return <Spinner />;

  if (error || !stats || !summary) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-ink-800 dark:bg-ink-900">
        <p className="font-display text-2xl">Analytics unavailable</p>
        <p className="mt-2 text-sm text-zinc-500">{error ?? "Stats could not be loaded."}</p>
      </div>
    );
  }

  const trendLabel =
    summary.changePct > 5
      ? "up"
      : summary.changePct < -5
        ? "down"
        : "steady";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Analytics</p>
        <h1 className="font-display text-3xl sm:text-4xl">How the site is doing</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          Plain numbers from the last month. Read the cards first, then glance at the charts —
          each chart includes a short explanation underneath.
        </p>
      </div>

      <Card>
        <h2 className="font-medium">In plain English</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Insight
            title={`Readers this week: ${formatNumber(summary.recentViews)}`}
            body={
              trendLabel === "up"
                ? `Traffic is up about ${summary.changePct}% versus the week before. Keep publishing on topics that already draw visits.`
                : trendLabel === "down"
                  ? `Traffic is down about ${Math.abs(summary.changePct)}% versus the week before. Check whether a quieter publishing week or a top article cooling off explains it.`
                  : "Traffic is roughly the same as last week — steady, not stalled."
            }
          />
          <Insight
            title={`About ${formatNumber(Math.round(summary.dailyAvg))} visits a day`}
            body="That is the average for the last 7 days. A quiet day below this is normal; a spike often means one post got shared."
          />
          <Insight
            title={`${summary.publishedShare}% of articles are live`}
            body={
              summary.draftsWaiting > 0
                ? `You have ${summary.draftsWaiting} draft${summary.draftsWaiting === 1 ? "" : "s"} waiting. Publishing even one can lift the next week’s views.`
                : "Almost everything written is already published — the next lift comes from new pieces."
            }
          />
          <Insight
            title={
              summary.topArticle
                ? `Top story: “${summary.topArticle.title}”`
                : "No top story yet"
            }
            body={
              summary.topArticle
                ? `${formatNumber(summary.topArticle.views)} total views. Promote this one, or write a follow-up on the same theme.`
                : "Once posts collect views, the leaders will show up here."
            }
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total views",
            value: stats.total_views,
            hint: "All-time reads across every article",
          },
          {
            label: "Live articles",
            value: stats.published_articles,
            hint: "Visible to the public right now",
          },
          {
            label: "Drafts",
            value: stats.draft_articles,
            hint: "Written but not published yet",
          },
          {
            label: "Scheduled",
            value: stats.scheduled_articles,
            hint: "Set to go live later",
          },
        ].map((card) => (
          <Card key={card.label}>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{card.label}</p>
            <p className="mt-2 font-display text-3xl sm:text-4xl">{formatNumber(card.value)}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{card.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="font-medium">Daily readers</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Each bar is one day. Taller = more people opened articles that day.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={viewChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.35} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                <Tooltip
                  formatter={(value) => [`${formatNumber(Number(value))} visits`, "Readers"]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Bar dataKey="views" fill="#c45c26" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {summary.bestDay ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              Busiest day so far: <strong>{shortDate(summary.bestDay.date)}</strong> with{" "}
              {formatNumber(summary.bestDay.views)} visits.
            </p>
          ) : null}
        </Card>

        <Card>
          <h2 className="font-medium">Publishing rhythm</h2>
          <p className="mt-1 text-sm text-zinc-500">
            How often new articles went live. Gaps usually mean quieter weeks in the newsroom.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={publishChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.35} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip
                  formatter={(value) => [`${formatNumber(Number(value))} articles`, "Published"]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="articles"
                  stroke="#161310"
                  fill="#161310"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
            Library size: {formatNumber(stats.total_articles)} articles across{" "}
            {formatNumber(stats.categories)} categories and {formatNumber(stats.tags)} tags.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-medium">Most-read articles</h2>
            <p className="mt-1 text-sm text-zinc-500">
              What people actually finish opening. Use this list to decide what to promote or follow up.
            </p>
          </div>
          <Link to="/admin/articles" className="text-sm text-rust-600 hover:underline">
            Manage articles
          </Link>
        </div>
        {top.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500">No view data yet — publish a few pieces and check back.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {top.map((article, index) => {
              const viewsCount = article.views ?? 0;
              const max = top[0]?.views || 1;
              const share = Math.max(6, Math.round((viewsCount / max) * 100));
              return (
                <div key={article.id} className="rounded-2xl border border-ink-200/70 p-3 dark:border-ink-700">
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">#{index + 1}</p>
                      <Link to={`/admin/articles/${article.id}`} className="mt-1 font-medium hover:text-rust-600">
                        {article.title}
                      </Link>
                      <p className="mt-1 text-xs text-zinc-500">
                        By {articleAuthorName(article)}
                        {article.status ? ` · ${article.status}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl leading-none">{formatNumber(viewsCount)}</p>
                      <p className="mt-1 text-xs text-zinc-500">views</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                    <div className="h-full rounded-full bg-rust-500" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
