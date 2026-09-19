<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->hasPermission('settings.manage'), 403);

        $paginator = AuditLog::query()
            ->with('user:id,name,email')
            ->when($request->string('action')->toString(), fn ($q, $action) => $q->where('action', 'like', "%{$action}%"))
            ->latest('created_at')
            ->paginate((int) $request->integer('per_page', 20));

        return ApiResponse::success([
            'items' => AuditLogResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Audit logs retrieved');
    }
}
