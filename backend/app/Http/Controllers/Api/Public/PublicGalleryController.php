<?php

namespace App\Http\Controllers\Api\Public;

use App\Enums\GalleryType;
use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryWorkResource;
use App\Services\GalleryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PublicGalleryController extends Controller
{
    public function __construct(private readonly GalleryService $gallery) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::enum(GalleryType::class)],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        $type = GalleryType::from($data['type']);
        $paginator = $this->gallery->paginate($type, $data, publishedOnly: true);

        return ApiResponse::success([
            'type' => $type->value,
            'label' => $type->label(),
            'items' => GalleryWorkResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], $type->label().' gallery retrieved');
    }
}
