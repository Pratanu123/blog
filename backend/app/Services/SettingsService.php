<?php

namespace App\Services;

use App\Models\Setting;

class SettingsService
{
    public function __construct(private readonly CacheService $cache) {}

    public function all(): array
    {
        return $this->cache->remember(CacheService::SETTINGS, 3600, function () {
            return Setting::query()->pluck('value', 'key')->all();
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
                ['value' => is_array($value) ? json_encode($value) : $value],
            );
        }

        $this->cache->flushSettings();

        return $this->all();
    }
}
