<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class CacheService
{
    public const HOMEPAGE = 'cms.homepage';

    public const POPULAR_ARTICLES = 'cms.popular_articles';

    public const CATEGORIES = 'cms.categories';

    public const TAGS = 'cms.tags';

    public const SETTINGS = 'cms.settings';

    public function articleKey(string $slug): string
    {
        return 'cms.article.'.$slug;
    }

    public function remember(string $key, int $ttl, callable $callback): mixed
    {
        return Cache::remember($key, $ttl, $callback);
    }

    public function forgetArticle(string $slug): void
    {
        Cache::forget($this->articleKey($slug));
        $this->flushListingCaches();
    }

    public function flushListingCaches(): void
    {
        Cache::forget(self::HOMEPAGE);
        Cache::forget(self::POPULAR_ARTICLES);
        Cache::forget(self::CATEGORIES);
        Cache::forget(self::TAGS);
        Cache::forget('cms.sitemap');
        Cache::forget('cms.rss');
    }

    public function flushSettings(): void
    {
        Cache::forget(self::SETTINGS);
        Cache::forget(self::HOMEPAGE);
        Cache::forget('cms.sitemap');
        Cache::forget('cms.robots');
    }
}
