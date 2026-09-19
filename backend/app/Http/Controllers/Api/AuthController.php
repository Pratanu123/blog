<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = $this->auth->login($request->validated('email'), $request->validated('password'));

        return ApiResponse::success(new UserResource($user), 'Logged in successfully');
    }

    public function logout(): JsonResponse
    {
        $this->auth->logout();

        return ApiResponse::success(null, 'Logged out successfully');
    }

    public function me(): JsonResponse
    {
        $user = auth()->user()?->load('role.permissions');

        return ApiResponse::success(new UserResource($user), 'Current user');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $status = $this->auth->sendResetLink($request->validated('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            return ApiResponse::error(__($status), 422);
        }

        return ApiResponse::success(null, __($status));
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->auth->resetPassword($request->validated());

        if ($status !== Password::PASSWORD_RESET) {
            return ApiResponse::error(__($status), 422);
        }

        return ApiResponse::success(null, __($status));
    }
}
