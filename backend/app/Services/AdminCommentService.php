<?php

namespace App\Services;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\ContentComment;
use App\Models\GalleryWork;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class AdminCommentService
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = ContentComment::query()->latest();

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search) {
                $builder->where('author_name', 'like', "%{$search}%")
                    ->orWhere('author_email', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['target_type'])) {
            $query->where('target_type', $filters['target_type']);
        }

        if (array_key_exists('is_approved', $filters) && $filters['is_approved'] !== null && $filters['is_approved'] !== '') {
            $query->where('is_approved', filter_var($filters['is_approved'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->paginate((int) ($filters['per_page'] ?? 20));
    }

    public function create(array $data, User $actor): ContentComment
    {
        $this->assertTargetExists($data['target_type'], (int) $data['target_id']);

        $comment = ContentComment::query()->create([
            'target_type' => $data['target_type'],
            'target_id' => $data['target_id'],
            'author_name' => $data['author_name'],
            'author_email' => $data['author_email'] ?? null,
            'body' => $data['body'],
            'is_approved' => array_key_exists('is_approved', $data) ? (bool) $data['is_approved'] : true,
        ]);

        $this->auditLogger->record('comment.created', $comment, null, [
            'target_type' => $comment->target_type,
            'target_id' => $comment->target_id,
        ], $actor);

        return $comment;
    }

    public function update(ContentComment $comment, array $data, User $actor): ContentComment
    {
        if (isset($data['target_type'], $data['target_id'])) {
            $this->assertTargetExists($data['target_type'], (int) $data['target_id']);
        }

        $old = $comment->only(['author_name', 'author_email', 'body', 'is_approved', 'target_type', 'target_id']);

        $comment->fill([
            'target_type' => $data['target_type'] ?? $comment->target_type,
            'target_id' => $data['target_id'] ?? $comment->target_id,
            'author_name' => $data['author_name'] ?? $comment->author_name,
            'author_email' => array_key_exists('author_email', $data) ? $data['author_email'] : $comment->author_email,
            'body' => $data['body'] ?? $comment->body,
            'is_approved' => array_key_exists('is_approved', $data) ? (bool) $data['is_approved'] : $comment->is_approved,
        ])->save();

        $this->auditLogger->record('comment.updated', $comment, $old, $comment->only(array_keys($old)), $actor);

        return $comment->fresh();
    }

    public function delete(ContentComment $comment, User $actor): void
    {
        $this->auditLogger->record('comment.deleted', $comment, $comment->toArray(), null, $actor);
        $comment->delete();
    }

    public function targetLabel(string $type, int $id): ?string
    {
        return match ($type) {
            'article' => Article::query()->whereKey($id)->value('title'),
            'gallery_work' => GalleryWork::query()->whereKey($id)->value('title'),
            default => null,
        };
    }

    public function targetUrl(string $type, int $id): ?string
    {
        return match ($type) {
            'article' => ($slug = Article::query()->whereKey($id)->value('slug')) ? "/blog/{$slug}" : null,
            'gallery_work' => ($work = GalleryWork::query()->find($id))
                ? '/'.($work->type?->value ?? $work->type).'?work='.$work->id
                : null,
            default => null,
        };
    }

    private function assertTargetExists(string $type, int $id): void
    {
        $exists = match ($type) {
            'article' => Article::query()->whereKey($id)->where('status', ArticleStatus::Published)->exists()
                || Article::query()->whereKey($id)->exists(),
            'gallery_work' => GalleryWork::query()->whereKey($id)->exists(),
            default => false,
        };

        if (! $exists) {
            throw ValidationException::withMessages([
                'target_id' => ['Selected content was not found.'],
            ]);
        }
    }
}
