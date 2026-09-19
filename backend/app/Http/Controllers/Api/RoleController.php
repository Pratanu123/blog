<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PermissionResource;
use App\Http\Resources\RoleResource;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditLogger;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    public function index(): JsonResponse
    {
        abort_unless(request()->user()?->hasPermission('users.view') || request()->user()?->hasPermission('settings.manage'), 403);

        return ApiResponse::success(
            RoleResource::collection(Role::query()->with('permissions')->orderBy('id')->get()),
            'Roles retrieved'
        );
    }

    public function permissions(): JsonResponse
    {
        abort_unless(request()->user()?->hasPermission('settings.manage'), 403);

        return ApiResponse::success(PermissionResource::collection(Permission::query()->orderBy('slug')->get()), 'Permissions retrieved');
    }

    public function updatePermissions(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()?->hasPermission('settings.manage'), 403);

        $data = $request->validate([
            'permission_ids' => ['required', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $old = $role->permissions()->pluck('permissions.id')->all();
        $role->permissions()->sync($data['permission_ids']);
        $this->auditLogger->record('role.permissions_updated', $role, ['permission_ids' => $old], $data, $request->user());

        return ApiResponse::success(new RoleResource($role->fresh('permissions')), 'Role permissions updated');
    }
}
