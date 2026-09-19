<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Article\StoreArticleRequest;
use App\Http\Requests\Article\UpdateArticleRequest;
use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\ArticleRevisionResource;
use App\Models\Article;
use App\Models\ArticleRevision;
use App\Services\ArticleService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function __construct(private readonly ArticleService $articles) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Article::class);

        $paginator = $this->articles->paginate($request->all(), $request->user());

        return ApiResponse::success([
            'items' => ArticleCardResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Articles retrieved');
    }

    public function store(StoreArticleRequest $request): JsonResponse
    {
        $article = $this->articles->create($request->validated(), $request->user());

        return ApiResponse::success(new ArticleResource($article), 'Article created successfully', 201);
    }

    public function show(Article $article): JsonResponse
    {
        $this->authorize('view', $article);

        return ApiResponse::success(new ArticleResource($article->load($this->articles->relations())), 'Article retrieved');
    }

    public function update(UpdateArticleRequest $request, Article $article): JsonResponse
    {
        $article = $this->articles->update($article, $request->validated(), $request->user());

        return ApiResponse::success(new ArticleResource($article), 'Article updated successfully');
    }

    public function destroy(Article $article): JsonResponse
    {
        $this->authorize('delete', $article);
        $this->articles->delete($article, request()->user());

        return ApiResponse::success(null, 'Article deleted successfully');
    }

    public function publish(Article $article): JsonResponse
    {
        $this->authorize('publish', $article);
        $article = $this->articles->publish($article, request()->user());

        return ApiResponse::success(new ArticleResource($article), 'Article published successfully');
    }

    public function schedule(Request $request, Article $article): JsonResponse
    {
        $this->authorize('publish', $article);
        $data = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);
        $article = $this->articles->schedule($article, $data['scheduled_at'], $request->user());

        return ApiResponse::success(new ArticleResource($article), 'Article scheduled successfully');
    }

    public function archive(Article $article): JsonResponse
    {
        $this->authorize('update', $article);
        $article = $this->articles->archive($article, request()->user());

        return ApiResponse::success(new ArticleResource($article), 'Article archived successfully');
    }

    public function duplicate(Article $article): JsonResponse
    {
        $this->authorize('create', Article::class);
        $this->authorize('view', $article);
        $copy = $this->articles->duplicate($article, request()->user());

        return ApiResponse::success(new ArticleResource($copy), 'Article duplicated successfully', 201);
    }

    public function bulk(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Article::class);
        $data = $request->validate([
            'action' => ['required', 'in:publish,archive,delete'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:articles,id'],
        ]);

        $count = $this->articles->bulk($data['action'], $data['ids'], $request->user());

        return ApiResponse::success(['count' => $count], 'Bulk action completed');
    }

    public function revisions(Article $article): JsonResponse
    {
        $this->authorize('view', $article);

        return ApiResponse::success(
            ArticleRevisionResource::collection($article->revisions()->with('user')->get()),
            'Revisions retrieved'
        );
    }

    public function showRevision(Article $article, ArticleRevision $revision): JsonResponse
    {
        $this->authorize('view', $article);
        abort_unless($revision->article_id === $article->id, 404);

        return ApiResponse::success(new ArticleRevisionResource($revision->load('user')), 'Revision retrieved');
    }

    public function restoreRevision(Article $article, ArticleRevision $revision): JsonResponse
    {
        $this->authorize('update', $article);
        abort_unless($revision->article_id === $article->id, 404);
        $article = $this->articles->restoreRevision($article, $revision, request()->user());

        return ApiResponse::success(new ArticleResource($article), 'Revision restored successfully');
    }
}
