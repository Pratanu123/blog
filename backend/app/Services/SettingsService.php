<?php

namespace App\Services;

use App\Models\Setting;

class SettingsService
{
    /** @var list<string> */
    private const JSON_KEYS = [
        'welcome_doors',
        'inspiration_thoughts',
    ];

    public function __construct(private readonly CacheService $cache) {}

    public function all(): array
    {
        return $this->cache->remember(CacheService::SETTINGS, 3600, function () {
            $raw = Setting::query()->pluck('value', 'key')->all();

            foreach (self::JSON_KEYS as $key) {
                if (! isset($raw[$key]) || ! is_string($raw[$key])) {
                    continue;
                }
                $decoded = json_decode($raw[$key], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $raw[$key] = $decoded;
                }
            }

            return $raw;
        });
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->all()[$key] ?? $default;
    }

    /**
     * Absolute public site origin for sitemap, robots, RSS, and emails.
     * Prefers a non-loopback CMS site_url; otherwise APP_URL (so production
     * is not stuck on http://localhost after a local seed).
     */
    public function siteUrl(): string
    {
        $fromSettings = trim((string) ($this->all()['site_url'] ?? ''));
        $fromConfig = rtrim(trim((string) config('app.url', '')), '/');

        if ($this->isPublicOrigin($fromSettings)) {
            return rtrim($fromSettings, '/');
        }

        if ($this->isPublicOrigin($fromConfig)) {
            return $fromConfig;
        }

        if ($fromSettings !== '') {
            return rtrim($fromSettings, '/');
        }

        return $fromConfig !== '' ? $fromConfig : 'http://localhost';
    }

    public function setMany(array $values): array
    {
        foreach ($values as $key => $value) {
            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value],
            );
        }

        $this->cache->flushSettings();

        return $this->all();
    }

    private function isPublicOrigin(string $url): bool
    {
        if ($url === '' || filter_var($url, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        if ($host === '') {
            return false;
        }

        if (in_array($host, ['localhost', '127.0.0.1', '::1'], true)) {
            return false;
        }

        if (str_ends_with($host, '.test') || str_ends_with($host, '.local') || str_ends_with($host, '.localhost')) {
            return false;
        }

        return true;
    }
}
