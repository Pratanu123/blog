<?php

namespace App\Services;

use App\Models\Tag;
use App\Support\SlugGenerator;
use Illuminate\Support\Collection;

class TagService
{
    public function __construct(
        private readonly SlugGenerator $slugs,
        private readonly AuditLogger $auditLogger,
        private readonly CacheService $cache,
    ) {}

    public function all(): Collection
    {
        return Tag::query()->orderBy('name')->get();
    }

    public function create(array $data, $actor): Tag
    {
        $tag = Tag::query()->create([
            'name' => $data['name'],
            'slug' => $this->slugs->unique($data['slug'] ?? $data['name'], Tag::class),
        ]);

        $this->auditLogger->record('tag.created', $tag, user: $actor);
        $this->cache->flushListingCaches();

        return $tag;
    }

    public function update(Tag $tag, array $data, $actor): Tag
    {
        $old = $tag->only(['name', 'slug']);
        $tag->fill([
            'name' => $data['name'] ?? $tag->name,
            'slug' => $this->slugs->unique($data['slug'] ?? $data['name'] ?? $tag->name, Tag::class, $tag->id),
        ])->save();

        $this->auditLogger->record('tag.updated', $tag, $old, $tag->only(['name', 'slug']), $actor);
        $this->cache->flushListingCaches();

        return $tag;
    }

    public function delete(Tag $tag, $actor): void
    {
        $this->auditLogger->record('tag.deleted', $tag, $tag->only(['name']), user: $actor);
        $tag->delete();
        $this->cache->flushListingCaches();
    }
}
