<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use App\Services\ContactMessageService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    public function __construct(private readonly ContactMessageService $messages) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ContactMessage::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'in:read,unread'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->messages->paginate($filters);

        return ApiResponse::success([
            'items' => ContactMessageResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'unread_count' => $this->messages->unreadCount(),
        ], 'Contact messages retrieved');
    }

    public function show(ContactMessage $contactMessage): JsonResponse
    {
        $this->authorize('manage', ContactMessage::class);
        $message = $this->messages->markRead($contactMessage, request()->user());

        return ApiResponse::success(new ContactMessageResource($message), 'Contact message retrieved');
    }

    public function markRead(ContactMessage $contactMessage): JsonResponse
    {
        $this->authorize('manage', ContactMessage::class);
        $message = $this->messages->markRead($contactMessage, request()->user());

        return ApiResponse::success(new ContactMessageResource($message), 'Marked as read');
    }

    public function markUnread(ContactMessage $contactMessage): JsonResponse
    {
        $this->authorize('manage', ContactMessage::class);
        $message = $this->messages->markUnread($contactMessage, request()->user());

        return ApiResponse::success(new ContactMessageResource($message), 'Marked as unread');
    }

    public function destroy(ContactMessage $contactMessage): JsonResponse
    {
        $this->authorize('manage', ContactMessage::class);
        $this->messages->delete($contactMessage, request()->user());

        return ApiResponse::success(null, 'Contact message deleted');
    }
}
