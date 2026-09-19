<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tag\StoreTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Services\TagService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class TagController extends Controller
{
    public function __construct(private readonly TagService $tags) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Tag::class);

        return ApiResponse::success(TagResource::collection($this->tags->all()), 'Tags retrieved');
    }

    public function store(StoreTagRequest $request): JsonResponse
    {
        $tag = $this->tags->create($request->validated(), $request->user());

        return ApiResponse::success(new TagResource($tag), 'Tag created successfully', 201);
    }

    public function update(StoreTagRequest $request, Tag $tag): JsonResponse
    {
        $tag = $this->tags->update($tag, $request->validated(), $request->user());

        return ApiResponse::success(new TagResource($tag), 'Tag updated successfully');
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $this->authorize('manage', Tag::class);
        $this->tags->delete($tag, request()->user());

        return ApiResponse::success(null, 'Tag deleted successfully');
    }
}
