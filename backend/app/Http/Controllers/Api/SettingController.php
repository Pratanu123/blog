<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Models\Setting;
use App\Services\SettingsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function __construct(private readonly SettingsService $settings) {}

    public function index(): JsonResponse
    {
        $this->authorize('manage', Setting::class);

        return ApiResponse::success($this->settings->all(), 'Settings retrieved');
    }

    public function update(UpdateSettingRequest $request): JsonResponse
    {
        return ApiResponse::success($this->settings->setMany($request->validated()), 'Settings updated successfully');
    }
}
