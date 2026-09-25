<?php

namespace App\Services;

use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\CategoryResource;
use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;

class PublicContentService
{
    public function __construct(
        private readonly CacheService $cache,
        private readonly SettingsService $settings,
        private readonly ArticleService $articles,
    ) {}

    public function settings(): array
    {
        return $this->publicSettings();
    }

    public function homepage(): array
    {
        return $this->cache->remember(CacheService::HOMEPAGE, 300, function () {
            $featured = Article::query()
                ->with($this->cardRelations())
                ->published()
                ->latest('published_at')
                ->limit(3)
                ->get();

            $latest = Article::query()
                ->with($this->cardRelations())
                ->published()
                ->latest('published_at')
                ->skip(3)
                ->limit(6)
                ->get();

            $popular = $this->popularArticles();
            $categories = Category::query()->whereNull('parent_id')->with('children')->orderBy('name')->get();

            return [
                'settings' => $this->publicSettings(),
                'featured' => ArticleCardResource::collection($featured)->resolve(),
                'latest' => ArticleCardResource::collection($latest)->resolve(),
                'popular' => ArticleCardResource::collection($popular)->resolve(),
                'categories' => CategoryResource::collection($categories)->resolve(),
            ];
        });
    }

    public function popularArticles(int $limit = 5)
    {
        $ids = $this->cache->remember(CacheService::POPULAR_ARTICLES, 300, function () use ($limit) {
            return Article::query()
                ->published()
                ->orderByDesc('views')
                ->limit($limit)
                ->pluck('id')
                ->all();
        });

        return Article::query()
            ->with($this->cardRelations())
            ->whereIn('id', $ids)
            ->orderByDesc('views')
            ->get();
    }

    public function showArticle(string $slug): Article
    {
        $id = $this->cache->remember($this->cache->articleKey($slug), 300, function () use ($slug) {
            return Article::query()->published()->where('slug', $slug)->value('id');
        });

        abort_unless($id, 404);

        $article = Article::query()
            ->with(['author.role', 'category.parent', 'featuredImage', 'ogImage', 'tags'])
            ->published()
            ->findOrFail($id);

        $this->articles->recordView($article);

        $article->setRelation(
            'related',
            Article::query()
                ->with($this->cardRelations())
                ->published()
                ->where('id', '!=', $article->id)
                ->where(function ($query) use ($article) {
                    $query->where('category_id', $article->category_id)
                        ->orWhereHas('tags', fn ($tagQuery) => $tagQuery->whereIn('tags.id', $article->tags->pluck('id')));
                })
                ->latest('published_at')
                ->limit(3)
                ->get()
        );

        return $article;
    }

    public function articlesByCategory(string $slug)
    {
        $category = Category::query()->with('children')->where('slug', $slug)->firstOrFail();
        $ids = collect([$category->id])->merge($category->children->pluck('id'));

        $articles = Article::query()
            ->with($this->cardRelations())
            ->published()
            ->whereIn('category_id', $ids)
            ->latest('published_at')
            ->paginate(9);

        return [$category, $articles];
    }

    public function articlesByTag(string $slug)
    {
        $tag = Tag::query()->where('slug', $slug)->firstOrFail();
        $articles = Article::query()
            ->with($this->cardRelations())
            ->published()
            ->whereHas('tags', fn ($query) => $query->where('tags.id', $tag->id))
            ->latest('published_at')
            ->paginate(9);

        return [$tag, $articles];
    }

    public function articlesByAuthor(string $slug)
    {
        $author = User::query()->with('role')->where('slug', $slug)->firstOrFail();
        $articles = Article::query()
            ->with($this->cardRelations())
            ->published()
            ->where('author_id', $author->id)
            ->latest('published_at')
            ->paginate(9);

        return [$author, $articles];
    }

    /**
     * @return list<string>
     */
    private function cardRelations(): array
    {
        return ['author:id,name,slug,avatar', 'category:id,name,slug', 'featuredImage', 'tags:id,name,slug'];
    }

    private function publicSettings(): array
    {
        $settings = $this->settings->all();
        $settings['site_url'] = $this->settings->siteUrl();
        unset($settings['google_site_verification_file_content']);

        return $settings;
    }
}
