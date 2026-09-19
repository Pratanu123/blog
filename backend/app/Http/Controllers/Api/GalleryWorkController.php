<?php

namespace App\Http\Controllers\Api;

use App\Enums\GalleryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Gallery\StoreGalleryWorkRequest;
use App\Http\Requests\Gallery\UpdateGalleryWorkRequest;
use App\Http\Resources\GalleryWorkResource;
use App\Models\GalleryWork;
use App\Services\GalleryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class GalleryWorkController extends Controller
{
    public function __construct(private readonly GalleryService $gallery) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', GalleryWork::class);

        $data = $request->validate([
            'type' => ['required', Rule::enum(GalleryType::class)],
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        $type = GalleryType::from($data['type']);
        $paginator = $this->gallery->paginate($type, $data);

        return ApiResponse::success([
            'items' => GalleryWorkResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], $type->label().' works retrieved');
    }

    public function store(StoreGalleryWorkRequest $request): JsonResponse
    {
        try {
            $type = GalleryType::from($request->validated('type'));
            $work = $this->gallery->create(
                $type,
                $request->validated(),
                $request->file('file'),
                $request->user(),
            );
        } catch (RuntimeException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(new GalleryWorkResource($work), 'Gallery work created', 201);
    }

    public function update(UpdateGalleryWorkRequest $request, GalleryWork $galleryWork): JsonResponse
    {
        try {
            $work = $this->gallery->update(
                $galleryWork,
                $request->validated(),
                $request->user(),
                $request->file('file'),
            );
        } catch (RuntimeException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(new GalleryWorkResource($work), 'Gallery work updated');
    }

    public function destroy(GalleryWork $galleryWork): JsonResponse
    {
        $this->authorize('delete', $galleryWork);
        $this->gallery->delete($galleryWork, request()->user());

        return ApiResponse::success(null, 'Gallery work deleted');
    }
}
