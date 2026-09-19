<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Services\PublicContentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicArticleController extends Controller
{
    public function __construct(private readonly PublicContentService $content) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = Article::query()
            ->with(['author:id,name,slug,avatar', 'category:id,name,slug', 'featuredImage', 'tags:id,name,slug'])
            ->published()
            ->latest('published_at')
            ->paginate((int) $request->integer('per_page', 9));

        return ApiResponse::success([
            'items' => ArticleCardResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Published articles');
    }

    public function show(string $slug): JsonResponse
    {
        $article = $this->content->showArticle($slug);

        return ApiResponse::success(new ArticleResource($article), 'Article retrieved');
    }
}
