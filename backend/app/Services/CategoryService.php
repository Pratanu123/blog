<?php

namespace App\Services;

use App\Models\Category;
use App\Support\SlugGenerator;
use Illuminate\Support\Collection;

class CategoryService
{
    public function __construct(
        private readonly SlugGenerator $slugs,
        private readonly AuditLogger $auditLogger,
        private readonly CacheService $cache,
    ) {}

    public function tree(): Collection
    {
        return Category::query()
            ->with(['children.descendants'])
            ->whereNull('parent_id')
            ->orderBy('name')
            ->get();
    }

    public function create(array $data, $actor): Category
    {
        $category = Category::query()->create([
            ...$data,
            'slug' => $this->slugs->unique($data['slug'] ?? $data['name'], Category::class),
        ]);

        $this->auditLogger->record('category.created', $category, user: $actor);
        $this->cache->flushListingCaches();

        return $category;
    }

    public function update(Category $category, array $data, $actor): Category
    {
        $old = $category->only(['name', 'slug', 'parent_id']);
        $category->fill([
            ...$data,
            'slug' => $this->slugs->unique($data['slug'] ?? $data['name'] ?? $category->name, Category::class, $category->id),
        ])->save();

        $this->auditLogger->record('category.updated', $category, $old, $category->only(['name', 'slug', 'parent_id']), $actor);
        $this->cache->flushListingCaches();

        return $category->fresh('children');
    }

    public function delete(Category $category, $actor): void
    {
        $this->auditLogger->record('category.deleted', $category, $category->only(['name']), user: $actor);
        $category->delete();
        $this->cache->flushListingCaches();
    }
}
