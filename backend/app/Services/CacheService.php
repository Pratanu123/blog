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

    public const SITEMAP = 'cms.sitemap.v3';

    public const ROBOTS = 'cms.robots.v3';

    public const RSS = 'cms.rss.v3';

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
        $this->forgetSeoCaches();
    }

    public function flushSettings(): void
    {
        Cache::forget(self::SETTINGS);
        Cache::forget(self::HOMEPAGE);
        $this->forgetSeoCaches();
    }

    public function forgetSeoCaches(): void
    {
        Cache::forget(self::SITEMAP);
        Cache::forget(self::ROBOTS);
        Cache::forget(self::RSS);
        // Legacy keys from earlier builds
        Cache::forget('cms.sitemap');
        Cache::forget('cms.robots');
        Cache::forget('cms.rss');
    }
}
