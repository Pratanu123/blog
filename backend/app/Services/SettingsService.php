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
}
