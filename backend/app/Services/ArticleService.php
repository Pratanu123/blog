<?php

namespace App\Services;

use App\Enums\ArticleStatus;
use App\Jobs\ClearArticleCache;
use App\Jobs\GenerateArticleMetadata;
use App\Jobs\GenerateSitemap;
use App\Jobs\SendNewsletter;
use App\Models\Article;
use App\Models\ArticleRevision;
use App\Models\ArticleView;
use App\Models\User;
use App\Support\HtmlSanitizer;
use App\Support\SlugGenerator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ArticleService
{
    public function __construct(
        private readonly SlugGenerator $slugs,
        private readonly HtmlSanitizer $sanitizer,
        private readonly AuditLogger $auditLogger,
        private readonly CacheService $cache,
    ) {}

    public function paginate(array $filters, ?User $actor = null): LengthAwarePaginator
    {
        $query = Article::query()
            ->with(['author:id,name,slug', 'category:id,name,slug', 'featuredImage', 'tags:id,name,slug'])
            ->withCount('revisions');

        if ($actor?->isAuthorRole()) {
            $query->where('author_id', $actor->id);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['author_id'])) {
            $query->where('author_id', $filters['author_id']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        return $query->latest('updated_at')->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function create(array $data, User $actor): Article
    {
        return DB::transaction(function () use ($data, $actor) {
            $article = Article::query()->create($this->preparePayload($data, $actor, null));
            $article->tags()->sync($data['tag_ids'] ?? []);
            $this->storeRevision($article, $actor);
            $this->afterWrite($article, $actor, 'article.created');

            return $article->fresh($this->relations());
        });
    }

    public function update(Article $article, array $data, User $actor, bool $createRevision = true): Article
    {
        return DB::transaction(function () use ($article, $data, $actor, $createRevision) {
            $old = $article->only(['title', 'content', 'status', 'slug']);
            $article->fill($this->preparePayload($data, $actor, $article));
            $article->save();

            if (array_key_exists('tag_ids', $data)) {
                $article->tags()->sync($data['tag_ids'] ?? []);
            }

            if ($createRevision && $this->isMajorChange($old, $article)) {
                $this->storeRevision($article, $actor);
            }

            $this->afterWrite($article, $actor, 'article.updated', $old);

            return $article->fresh($this->relations());
        });
    }

    public function delete(Article $article, User $actor): void
    {
        $slug = $article->slug;
        $article->delete();
        $this->auditLogger->record('article.deleted', $article, ['title' => $article->title], user: $actor);
        ClearArticleCache::dispatch($slug);
    }

    public function publish(Article $article, User $actor): Article
    {
        $article->fill([
            'status' => ArticleStatus::Published,
            'published_at' => $article->published_at ?? now(),
            'scheduled_at' => null,
        ])->save();

        $this->afterWrite($article, $actor, 'article.published');
        SendNewsletter::dispatch($article->id);

        return $article->fresh($this->relations());
    }

    public function schedule(Article $article, string $scheduledAt, User $actor): Article
    {
        $article->fill([
            'status' => ArticleStatus::Scheduled,
            'scheduled_at' => $scheduledAt,
            'published_at' => null,
        ])->save();

        $this->afterWrite($article, $actor, 'article.scheduled');

        return $article->fresh($this->relations());
    }

    public function archive(Article $article, User $actor): Article
    {
        $article->fill(['status' => ArticleStatus::Archived])->save();
        $this->afterWrite($article, $actor, 'article.archived');

        return $article->fresh($this->relations());
    }

    public function duplicate(Article $article, User $actor): Article
    {
        $copy = $article->replicate(['slug', 'published_at', 'scheduled_at', 'views']);
        $copy->title = $article->title.' (Copy)';
        $copy->slug = $this->slugs->unique($copy->title, Article::class);
        $copy->status = ArticleStatus::Draft;
        $copy->author_id = $actor->id;
        $copy->views = 0;
        $copy->save();
        $copy->tags()->sync($article->tags()->pluck('tags.id'));
        $this->afterWrite($copy, $actor, 'article.duplicated');

        return $copy->fresh($this->relations());
    }

    public function restoreRevision(Article $article, ArticleRevision $revision, User $actor): Article
    {
        $article->fill([
            'title' => $revision->title,
            'content' => $revision->content,
            'excerpt' => $revision->excerpt,
        ])->save();

        $this->storeRevision($article, $actor);
        $this->afterWrite($article, $actor, 'article.revision_restored');

        return $article->fresh($this->relations());
    }

    public function publishScheduled(): int
    {
        $articles = Article::query()
            ->where('status', ArticleStatus::Scheduled)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($articles as $article) {
            $article->fill([
                'status' => ArticleStatus::Published,
                'published_at' => $article->scheduled_at,
            ])->save();
            $this->cache->forgetArticle($article->slug);
            GenerateSitemap::dispatch();
        }

        return $articles->count();
    }

    public function bulk(string $action, array $ids, User $actor): int
    {
        $articles = Article::query()->whereIn('id', $ids)->get();
        $count = 0;

        foreach ($articles as $article) {
            match ($action) {
                'publish' => $this->publish($article, $actor),
                'archive' => $this->archive($article, $actor),
                'delete' => $this->delete($article, $actor),
                default => null,
            };
            $count++;
        }

        return $count;
    }

    public function recordView(Article $article): void
    {
        $article->increment('views');
        $daily = ArticleView::query()->firstOrCreate(
            ['article_id' => $article->id, 'viewed_on' => now()->toDateString()],
            ['views' => 0],
        );
        $daily->increment('views');
    }

    private function preparePayload(array $data, User $actor, ?Article $existing): array
    {
        $title = $data['title'] ?? $existing?->title ?? 'Untitled';
        $status = ArticleStatus::from($data['status'] ?? $existing?->status?->value ?? ArticleStatus::Draft->value);

        $payload = [
            'title' => $title,
            'slug' => $this->slugs->unique($data['slug'] ?? $title, Article::class, $existing?->id),
            'excerpt' => $data['excerpt'] ?? $existing?->excerpt,
            'content' => $this->sanitizer->sanitize($data['content'] ?? $existing?->content),
            'featured_image_id' => array_key_exists('featured_image_id', $data)
                ? $data['featured_image_id']
                : $existing?->featured_image_id,
            'author_id' => $existing?->author_id ?? $actor->id,
            'category_id' => $data['category_id'] ?? $existing?->category_id,
            'status' => $status,
            'meta_title' => $data['meta_title'] ?? $existing?->meta_title,
            'meta_description' => $data['meta_description'] ?? $existing?->meta_description,
            'canonical_url' => $data['canonical_url'] ?? $existing?->canonical_url,
            'og_title' => $data['og_title'] ?? $existing?->og_title,
            'og_description' => $data['og_description'] ?? $existing?->og_description,
            'og_image_id' => $data['og_image_id'] ?? $existing?->og_image_id,
            'twitter_card' => $data['twitter_card'] ?? $existing?->twitter_card ?? 'summary_large_image',
            'scheduled_at' => $data['scheduled_at'] ?? $existing?->scheduled_at,
        ];

        if ($status === ArticleStatus::Published && empty($data['published_at']) && ! $existing?->published_at) {
            $payload['published_at'] = now();
        }

        if (! empty($data['published_at'])) {
            $payload['published_at'] = $data['published_at'];
        }

        if ($status === ArticleStatus::Draft) {
            $payload['scheduled_at'] = null;
        }

        // Keep explicit nulls for nullable FKs (e.g. clearing featured_image_id).
        $nullableKeys = ['featured_image_id', 'category_id', 'og_image_id', 'scheduled_at', 'canonical_url'];
        $filtered = Arr::where($payload, function ($value, $key) use ($nullableKeys) {
            return $value !== null || in_array($key, $nullableKeys, true);
        });

        return $filtered;
    }

    private function storeRevision(Article $article, User $actor): void
    {
        $next = ((int) $article->revisions()->max('revision_number')) + 1;

        ArticleRevision::query()->create([
            'article_id' => $article->id,
            'user_id' => $actor->id,
            'title' => $article->title,
            'content' => $article->content,
            'excerpt' => $article->excerpt,
            'revision_number' => $next,
        ]);
    }

    private function isMajorChange(array $old, Article $article): bool
    {
        return $old['title'] !== $article->title
            || $old['content'] !== $article->content
            || $old['status'] !== $article->status->value;
    }

    private function afterWrite(Article $article, User $actor, string $action, ?array $old = null): void
    {
        $this->auditLogger->record($action, $article, $old, $article->only(['title', 'status', 'slug']), $actor);
        GenerateArticleMetadata::dispatch($article->id);
        ClearArticleCache::dispatch($article->slug);
        GenerateSitemap::dispatch();
    }

    /**
     * @return list<string>
     */
    public function relations(): array
    {
        return ['author.role', 'category', 'featuredImage', 'ogImage', 'tags', 'revisions.user'];
    }
}
