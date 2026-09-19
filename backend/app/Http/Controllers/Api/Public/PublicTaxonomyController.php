<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\TagResource;
use App\Http\Resources\UserResource;
use App\Models\Category;
use App\Models\Tag;
use App\Services\PublicContentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PublicTaxonomyController extends Controller
{
    public function __construct(private readonly PublicContentService $content) {}

    public function categories(): JsonResponse
    {
        $categories = Category::query()->with('children')->whereNull('parent_id')->orderBy('name')->get();

        return ApiResponse::success(CategoryResource::collection($categories), 'Categories retrieved');
    }

    public function category(string $slug): JsonResponse
    {
        [$category, $articles] = $this->content->articlesByCategory($slug);

        return ApiResponse::success([
            'category' => new CategoryResource($category),
            'items' => ArticleCardResource::collection($articles->items()),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ], 'Category articles');
    }

    public function tags(): JsonResponse
    {
        return ApiResponse::success(TagResource::collection(Tag::query()->orderBy('name')->get()), 'Tags retrieved');
    }

    public function tag(string $slug): JsonResponse
    {
        [$tag, $articles] = $this->content->articlesByTag($slug);

        return ApiResponse::success([
            'tag' => new TagResource($tag),
            'items' => ArticleCardResource::collection($articles->items()),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ], 'Tag articles');
    }

    public function author(string $slug): JsonResponse
    {
        [$author, $articles] = $this->content->articlesByAuthor($slug);

        return ApiResponse::success([
            'author' => new UserResource($author),
            'items' => ArticleCardResource::collection($articles->items()),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ], 'Author articles');
    }
}
