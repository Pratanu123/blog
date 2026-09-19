<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SlugGenerator
{
    public function unique(string $value, string $modelClass, ?int $ignoreId = null, string $column = 'slug'): string
    {
        $slug = Str::slug($value);
        if ($slug === '') {
            $slug = 'item';
        }

        $original = $slug;
        $i = 2;

        while ($this->exists($modelClass, $column, $slug, $ignoreId)) {
            $slug = $original.'-'.$i;
            $i++;
        }

        return $slug;
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function exists(string $modelClass, string $column, string $slug, ?int $ignoreId): bool
    {
        return $modelClass::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where($column, $slug)
            ->exists();
    }
}
