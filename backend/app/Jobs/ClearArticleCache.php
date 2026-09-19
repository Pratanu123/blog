<?php

namespace App\Jobs;

use App\Services\CacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ClearArticleCache implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly ?string $slug = null) {}

    public function handle(CacheService $cache): void
    {
        if ($this->slug) {
            $cache->forgetArticle($this->slug);

            return;
        }

        $cache->flushListingCaches();
    }
}
