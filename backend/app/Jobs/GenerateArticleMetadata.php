<?php

namespace App\Jobs;

use App\Models\Article;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateArticleMetadata implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $articleId) {}

    public function handle(): void
    {
        $article = Article::query()->find($this->articleId);
        if (! $article) {
            return;
        }

        $text = trim(strip_tags((string) $article->content));
        $words = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $readingTime = max(1, (int) ceil(count($words) / 200));

        $excerpt = $article->excerpt;
        if (! $excerpt && $text !== '') {
            $excerpt = mb_substr($text, 0, 180);
            if (mb_strlen($text) > 180) {
                $excerpt .= '…';
            }
        }

        $article->forceFill([
            'reading_time' => $readingTime,
            'excerpt' => $excerpt,
            'meta_title' => $article->meta_title ?: $article->title,
            'og_title' => $article->og_title ?: $article->title,
        ])->saveQuietly();
    }
}
