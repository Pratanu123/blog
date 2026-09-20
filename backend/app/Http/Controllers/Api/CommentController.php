<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comment\StoreCommentRequest;
use App\Http\Requests\Comment\UpdateCommentRequest;
use App\Http\Resources\ContentCommentResource;
use App\Models\ContentComment;
use App\Services\AdminCommentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(private readonly AdminCommentService $comments) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ContentComment::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'target_type' => ['nullable', 'in:article,gallery_work'],
            'is_approved' => ['nullable'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->comments->paginate($filters);

        return ApiResponse::success([
            'items' => ContentCommentResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Comments retrieved');
    }

    public function store(StoreCommentRequest $request): JsonResponse
    {
        $comment = $this->comments->create($request->validated(), $request->user());

        return ApiResponse::success(new ContentCommentResource($comment), 'Comment created', 201);
    }

    public function update(UpdateCommentRequest $request, ContentComment $contentComment): JsonResponse
    {
        $comment = $this->comments->update($contentComment, $request->validated(), $request->user());

        return ApiResponse::success(new ContentCommentResource($comment), 'Comment updated');
    }

    public function destroy(ContentComment $contentComment): JsonResponse
    {
        $this->authorize('manage', ContentComment::class);
        $this->comments->delete($contentComment, request()->user());

        return ApiResponse::success(null, 'Comment deleted');
    }
}
