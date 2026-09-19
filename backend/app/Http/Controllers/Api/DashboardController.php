<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleCardResource;
use App\Models\Article;
use App\Services\DashboardService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboard) {}

    public function overview(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Article::class);

        $days = (int) $request->integer('days', 30);

        return ApiResponse::success([
            'stats' => $this->dashboard->stats(),
            'views' => $this->dashboard->viewsOverTime($days),
            'published' => $this->dashboard->articlesPublishedOverTime($days),
            'top' => ArticleCardResource::collection($this->dashboard->topArticles())->resolve(),
        ], 'Dashboard retrieved');
    }

    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', Article::class);

        return ApiResponse::success($this->dashboard->stats(), 'Dashboard stats retrieved');
    }

    public function views(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Article::class);

        return ApiResponse::success($this->dashboard->viewsOverTime((int) $request->integer('days', 30)), 'Views over time');
    }

    public function publishedOverTime(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Article::class);

        return ApiResponse::success(
            $this->dashboard->articlesPublishedOverTime((int) $request->integer('days', 30)),
            'Articles published over time'
        );
    }

    public function topArticles(): JsonResponse
    {
        $this->authorize('viewAny', Article::class);

        return ApiResponse::success(
            ArticleCardResource::collection($this->dashboard->topArticles()),
            'Top articles retrieved'
        );
    }
}
