<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StoreMediaRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use App\Services\MediaService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class MediaController extends Controller
{
    public function __construct(private readonly MediaService $media) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Media::class);
        $paginator = $this->media->paginate($request->all());

        return ApiResponse::success([
            'items' => MediaResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Media retrieved');
    }

    public function store(StoreMediaRequest $request): JsonResponse
    {
        try {
            $media = $this->media->upload($request->file('file'), $request->user(), $request->validated('alt_text'));
        } catch (RuntimeException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(new MediaResource($media), 'Image uploaded successfully', 201);
    }

    public function update(Request $request, Media $medium): JsonResponse
    {
        $this->authorize('manage', Media::class);
        $data = $request->validate([
            'alt_text' => ['nullable', 'string', 'max:180'],
        ]);
        $media = $this->media->update($medium, $data, $request->user());

        return ApiResponse::success(new MediaResource($media), 'Media updated successfully');
    }

    public function destroy(Media $medium): JsonResponse
    {
        $this->authorize('manage', Media::class);
        $this->media->delete($medium, request()->user());

        return ApiResponse::success(null, 'Media deleted successfully');
    }
}
