<?php

namespace Tests\Feature;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\ArticleRevision;
use App\Models\Category;
use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArticleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_update_article(): void
    {
        $admin = $this->cmsUser('admin');
        $category = Category::factory()->create();
        $tag = Tag::factory()->create();

        $create = $this->actingAs($admin)->postJson('/api/articles', [
            'title' => 'Learning Go in Production',
            'content' => '<p>Start with the standard library.</p>',
            'category_id' => $category->id,
            'tag_ids' => [$tag->id],
            'status' => 'draft',
        ]);

        $create->assertCreated()->assertJsonPath('success', true);
        $id = $create->json('data.id');

        $this->actingAs($admin)->putJson("/api/articles/{$id}", [
            'title' => 'Learning Go in Production',
            'content' => '<p>Updated content.</p>',
        ])->assertOk();

        $this->assertDatabaseHas('articles', ['id' => $id, 'title' => 'Learning Go in Production']);
        $this->assertGreaterThanOrEqual(1, ArticleRevision::query()->where('article_id', $id)->count());
    }

    public function test_article_can_be_published_and_archived(): void
    {
        $admin = $this->cmsUser();
        $article = Article::factory()->create(['author_id' => $admin->id]);

        $this->actingAs($admin)
            ->postJson("/api/articles/{$article->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $this->actingAs($admin)
            ->postJson("/api/articles/{$article->id}/archive")
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');
    }

    public function test_article_can_be_scheduled_and_published_by_command(): void
    {
        $admin = $this->cmsUser();
        $article = Article::factory()->create([
            'author_id' => $admin->id,
            'status' => ArticleStatus::Scheduled,
            'scheduled_at' => now()->subMinute(),
        ]);

        $this->artisan('articles:publish-scheduled')->assertSuccessful();

        $this->assertDatabaseHas('articles', [
            'id' => $article->id,
            'status' => ArticleStatus::Published->value,
        ]);
    }

    public function test_article_can_be_duplicated(): void
    {
        $admin = $this->cmsUser();
        $article = Article::factory()->published()->create(['author_id' => $admin->id]);

        $this->actingAs($admin)
            ->postJson("/api/articles/{$article->id}/duplicate")
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_soft_deleted_articles_are_hidden(): void
    {
        $admin = $this->cmsUser();
        $article = Article::factory()->create(['author_id' => $admin->id]);

        $this->actingAs($admin)->deleteJson("/api/articles/{$article->id}")->assertOk();
        $this->assertSoftDeleted('articles', ['id' => $article->id]);
    }

    public function test_revision_can_be_restored(): void
    {
        $admin = $this->cmsUser();
        $article = Article::factory()->create([
            'author_id' => $admin->id,
            'title' => 'Original title',
            'content' => '<p>Original</p>',
        ]);

        $revision = ArticleRevision::query()->create([
            'article_id' => $article->id,
            'user_id' => $admin->id,
            'title' => 'Older title',
            'content' => '<p>Older</p>',
            'excerpt' => 'Older',
            'revision_number' => 1,
        ]);

        $this->actingAs($admin)
            ->postJson("/api/articles/{$article->id}/revisions/{$revision->id}/restore")
            ->assertOk()
            ->assertJsonPath('data.title', 'Older title');
    }
}
