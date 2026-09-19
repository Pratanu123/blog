<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Services\PublicContentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function __construct(private readonly PublicContentService $content) {}

    public function settings(): JsonResponse
    {
        return ApiResponse::success($this->content->settings(), 'Public settings');
    }

    public function __invoke(): JsonResponse
    {
        $data = $this->content->homepage();

        return ApiResponse::success($data, 'Homepage data');
    }
}
