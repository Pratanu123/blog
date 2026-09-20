<?php

namespace App\Services;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\ContentComment;
use App\Models\ContentLike;
use App\Models\GalleryWork;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class EngagementService
{
    private const TYPES = ['article', 'gallery_work'];

    public function resolveTarget(string $type, int $id): Article|GalleryWork
    {
        if (! in_array($type, self::TYPES, true)) {
            throw ValidationException::withMessages([
                'type' => ['Unsupported engagement target.'],
            ]);
        }

        $model = match ($type) {
            'article' => Article::query()->where('status', ArticleStatus::Published)->find($id),
            'gallery_work' => GalleryWork::query()->where('is_published', true)->find($id),
        };

        if (! $model) {
            throw ValidationException::withMessages([
                'target' => ['Content not found.'],
            ]);
        }

        return $model;
    }

    public function summary(string $type, int $id, ?string $visitorKey): array
    {
        $this->resolveTarget($type, $id);

        return [
            'likes_count' => ContentLike::query()
                ->where('target_type', $type)
                ->where('target_id', $id)
                ->count(),
            'liked' => $visitorKey
                ? ContentLike::query()
                    ->where('target_type', $type)
                    ->where('target_id', $id)
                    ->where('visitor_key', $visitorKey)
                    ->exists()
                : false,
            'comments_count' => ContentComment::query()
                ->where('target_type', $type)
                ->where('target_id', $id)
                ->where('is_approved', true)
                ->count(),
            'comments' => $this->comments($type, $id),
        ];
    }

    public function comments(string $type, int $id): Collection
    {
        $this->resolveTarget($type, $id);

        return ContentComment::query()
            ->where('target_type', $type)
            ->where('target_id', $id)
            ->where('is_approved', true)
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn (ContentComment $comment) => [
                'id' => $comment->id,
                'author_name' => $comment->author_name,
                'body' => $comment->body,
                'created_at' => $comment->created_at?->toIso8601String(),
            ]);
    }

    public function addComment(string $type, int $id, array $data): array
    {
        $this->resolveTarget($type, $id);

        $comment = ContentComment::query()->create([
            'target_type' => $type,
            'target_id' => $id,
            'author_name' => $data['author_name'],
            'author_email' => $data['author_email'] ?? null,
            'body' => $data['body'],
            'is_approved' => true,
        ]);

        return [
            'id' => $comment->id,
            'author_name' => $comment->author_name,
            'body' => $comment->body,
            'created_at' => $comment->created_at?->toIso8601String(),
        ];
    }

    public function toggleLike(string $type, int $id, string $visitorKey): array
    {
        $this->resolveTarget($type, $id);

        $existing = ContentLike::query()
            ->where('target_type', $type)
            ->where('target_id', $id)
            ->where('visitor_key', $visitorKey)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            ContentLike::query()->create([
                'target_type' => $type,
                'target_id' => $id,
                'visitor_key' => $visitorKey,
            ]);
            $liked = true;
        }

        return [
            'liked' => $liked,
            'likes_count' => ContentLike::query()
                ->where('target_type', $type)
                ->where('target_id', $id)
                ->count(),
        ];
    }
}
