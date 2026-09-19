<?php

namespace App\Services;

use App\Models\Article;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SearchService
{
    public function articles(string $term, int $perPage = 12): LengthAwarePaginator
    {
        $query = Article::query()
            ->with(['author:id,name,slug', 'category:id,name,slug', 'featuredImage', 'tags:id,name,slug'])
            ->published();

        $term = trim($term);

        if ($term === '') {
            return $query->latest('published_at')->paginate($perPage);
        }

        $query->where(function ($builder) use ($term) {
            if (DB::connection()->getDriverName() === 'mysql') {
                $boolean = $this->booleanTerm($term);
                if ($boolean !== '') {
                    $builder->whereRaw('MATCH(title, excerpt, content) AGAINST(? IN BOOLEAN MODE)', [$boolean]);
                }
                $builder->orWhere('title', 'like', '%'.$term.'%')
                    ->orWhere('slug', 'like', '%'.$term.'%')
                    ->orWhere('excerpt', 'like', '%'.$term.'%');
                $this->applyRelationalSearch($builder, $term);
            } else {
                $this->applyLikeSearch($builder, $term);
            }
        });

        return $query->latest('published_at')->paginate($perPage);
    }

    private function applyLikeSearch($query, string $term): void
    {
        $like = '%'.$term.'%';
        $query->where(function ($builder) use ($like, $term) {
        $builder->where('title', 'like', $like)
            ->orWhere('slug', 'like', $like)
            ->orWhere('excerpt', 'like', $like)
            ->orWhere('content', 'like', $like);
            $this->applyRelationalSearch($builder, $term);
        });
    }

    private function applyRelationalSearch($builder, string $term): void
    {
        $like = '%'.$term.'%';

        $builder->orWhereHas('tags', fn ($q) => $q->where('name', 'like', $like)->orWhere('slug', 'like', $like))
            ->orWhereHas('category', fn ($q) => $q->where('name', 'like', $like)->orWhere('slug', 'like', $like));
    }

    private function booleanTerm(string $term): string
    {
        $words = preg_split('/\s+/', $term, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return collect($words)
            ->map(fn (string $word) => '+'.preg_replace('/[^\pL\pN]+/u', '', $word).'*')
            ->filter(fn (string $word) => $word !== '+*')
            ->implode(' ');
    }
}
