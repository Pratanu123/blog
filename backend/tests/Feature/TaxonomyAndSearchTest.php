<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaxonomyAndSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_editor_can_manage_categories_and_tags(): void
    {
        $editor = $this->cmsUser('editor');

        $category = $this->actingAs($editor)->postJson('/api/categories', [
            'name' => 'Programming',
        ])->assertCreated()->json('data');

        $this->actingAs($editor)->putJson("/api/categories/{$category['id']}", [
            'name' => 'Software',
        ])->assertOk()->assertJsonPath('data.slug', 'software');

        $tag = $this->actingAs($editor)->postJson('/api/tags', [
            'name' => 'Golang',
        ])->assertCreated()->json('data');

        $this->actingAs($editor)->deleteJson("/api/tags/{$tag['id']}")->assertOk();
        $this->assertDatabaseMissing('tags', ['id' => $tag['id']]);
    }

    public function test_public_search_matches_title_and_taxonomy(): void
    {
        $author = $this->cmsUser('author');
        $category = Category::factory()->create(['name' => 'Programming', 'slug' => 'programming']);
        $tag = Tag::factory()->create(['name' => 'Golang', 'slug' => 'golang']);

        $article = Article::factory()->published()->create([
            'author_id' => $author->id,
            'category_id' => $category->id,
            'title' => 'How to learn Golang',
            'excerpt' => 'A practical path',
            'content' => '<p>Channels and interfaces</p>',
        ]);
        $article->tags()->attach($tag->id);

        $this->getJson('/api/search?q=Golang')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['slug' => $article->slug]);
    }

    public function test_public_article_is_available_by_slug(): void
    {
        $author = $this->cmsUser('author');
        $article = Article::factory()->published()->create([
            'author_id' => $author->id,
            'slug' => 'system-design-guide',
            'title' => 'System Design Guide',
        ]);

        $this->getJson('/api/public/articles/system-design-guide')
            ->assertOk()
            ->assertJsonPath('data.slug', 'system-design-guide');

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
        ]);
    }

    public function test_sitemap_and_feed_are_generated(): void
    {
        $author = $this->cmsUser('author');
        Article::factory()->published()->create([
            'author_id' => $author->id,
            'slug' => 'how-to-learn-golang',
        ]);

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee('how-to-learn-golang', false)
            ->assertSee('/photography', false)
            ->assertSee('/painting', false);
        $this->get('/feed.xml')->assertOk()->assertSee('rss', false);
        $this->get('/robots.txt')->assertOk()->assertSee('Sitemap', false);
    }

    public function test_google_verification_file_is_served_from_settings(): void
    {
        \App\Models\Setting::query()->updateOrCreate(
            ['key' => 'google_site_verification_filename'],
            ['value' => 'google123abc.html'],
        );
        \App\Models\Setting::query()->updateOrCreate(
            ['key' => 'google_site_verification_file_content'],
            ['value' => 'google-site-verification: abc123'],
        );
        app(\App\Services\CacheService::class)->flushSettings();

        $this->get('/google123abc.html')
            ->assertOk()
            ->assertSee('google-site-verification: abc123', false);

        $this->get('/googlewrong.html')->assertNotFound();
    }

    public function test_sitemap_uses_app_url_when_site_url_is_localhost(): void
    {
        config(['app.url' => 'https://inkandvoltage.com']);

        \App\Models\Setting::query()->updateOrCreate(
            ['key' => 'site_url'],
            ['value' => 'http://localhost'],
        );
        app(\App\Services\CacheService::class)->flushSettings();

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertSee('https://inkandvoltage.com/', false)
            ->assertDontSee('http://localhost/', false);
    }
}
