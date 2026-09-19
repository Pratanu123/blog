<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryService $categories) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        return ApiResponse::success(CategoryResource::collection($this->categories->tree()), 'Categories retrieved');
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->categories->create($request->validated(), $request->user());

        return ApiResponse::success(new CategoryResource($category), 'Category created successfully', 201);
    }

    public function update(StoreCategoryRequest $request, Category $category): JsonResponse
    {
        $category = $this->categories->update($category, $request->validated(), $request->user());

        return ApiResponse::success(new CategoryResource($category), 'Category updated successfully');
    }

    public function destroy(Category $category): JsonResponse
    {
        $this->authorize('manage', Category::class);
        $this->categories->delete($category, request()->user());

        return ApiResponse::success(null, 'Category deleted successfully');
    }
}
