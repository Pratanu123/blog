<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Services\EngagementService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EngagementController extends Controller
{
    public function __construct(private readonly EngagementService $engagement) {}

    public function show(Request $request, string $type, int $id): JsonResponse
    {
        $visitorKey = $this->visitorKey($request);

        return ApiResponse::success($this->engagement->summary($type, $id, $visitorKey));
    }

    public function storeComment(Request $request, string $type, int $id): JsonResponse
    {
        $data = $request->validate([
            'author_name' => ['required', 'string', 'max:120'],
            'author_email' => ['nullable', 'email', 'max:180'],
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $comment = $this->engagement->addComment($type, $id, $data);

        return ApiResponse::success($comment, 'Comment posted', 201);
    }

    public function toggleLike(Request $request, string $type, int $id): JsonResponse
    {
        $data = $request->validate([
            'visitor_key' => ['required', 'string', 'min:16', 'max:64'],
        ]);

        return ApiResponse::success(
            $this->engagement->toggleLike($type, $id, $data['visitor_key']),
            'Like updated'
        );
    }

    private function visitorKey(Request $request): ?string
    {
        $key = $request->header('X-Visitor-Key') ?: $request->query('visitor_key');

        if (! is_string($key) || strlen($key) < 16 || strlen($key) > 64) {
            return null;
        }

        return $key;
    }
}
