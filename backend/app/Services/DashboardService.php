<?php

namespace App\Services;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\ArticleView;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Carbon;

class DashboardService
{
    public function stats(): array
    {
        return [
            'total_articles' => Article::query()->count(),
            'published_articles' => Article::query()->where('status', ArticleStatus::Published)->count(),
            'draft_articles' => Article::query()->where('status', ArticleStatus::Draft)->count(),
            'scheduled_articles' => Article::query()->where('status', ArticleStatus::Scheduled)->count(),
            'total_views' => (int) Article::query()->sum('views'),
            'total_authors' => User::query()->whereHas('role', fn ($q) => $q->whereIn('slug', ['author', 'editor', 'admin', 'super-admin']))->count(),
            'categories' => Category::query()->count(),
            'tags' => Tag::query()->count(),
        ];
    }

    public function viewsOverTime(int $days = 30): array
    {
        $from = now()->subDays($days - 1)->startOfDay();

        $rows = ArticleView::query()
            ->selectRaw('viewed_on, SUM(views) as total')
            ->where('viewed_on', '>=', $from->toDateString())
            ->groupBy('viewed_on')
            ->orderBy('viewed_on')
            ->pluck('total', 'viewed_on');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $from->copy()->addDays($i)->toDateString();
            $series[] = [
                'date' => $date,
                'views' => (int) ($rows[$date] ?? 0),
            ];
        }

        return $series;
    }

    public function articlesPublishedOverTime(int $days = 30): array
    {
        $from = now()->subDays($days - 1)->startOfDay();

        $rows = Article::query()
            ->selectRaw('DATE(published_at) as day, COUNT(*) as total')
            ->where('status', ArticleStatus::Published)
            ->where('published_at', '>=', $from)
            ->groupByRaw('DATE(published_at)')
            ->orderByRaw('DATE(published_at)')
            ->pluck('total', 'day');

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $date = $from->copy()->addDays($i)->toDateString();
            $series[] = [
                'date' => $date,
                'articles' => (int) ($rows[$date] ?? 0),
            ];
        }

        return $series;
    }

    public function topArticles(int $limit = 8): array
    {
        return Article::query()
            ->with(['author:id,name', 'category:id,name'])
            ->orderByDesc('views')
            ->limit($limit)
            ->get(['id', 'title', 'slug', 'views', 'status', 'published_at', 'author_id', 'category_id'])
            ->all();
    }
}
