<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private readonly UserService $users) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);
        $paginator = $this->users->paginate($request->all());

        return ApiResponse::success([
            'items' => UserResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Users retrieved');
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->users->create($request->validated(), $request->user());

        return ApiResponse::success(new UserResource($user), 'User created successfully', 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->users->update($user, $request->validated(), $request->user());

        return ApiResponse::success(new UserResource($user), 'User updated successfully');
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);
        $this->users->delete($user, request()->user());

        return ApiResponse::success(null, 'User deleted successfully');
    }
}
