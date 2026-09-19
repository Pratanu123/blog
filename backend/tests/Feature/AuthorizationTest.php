<?php

namespace Tests\Feature;

use App\Models\Article;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_author_cannot_publish(): void
    {
        $author = $this->cmsUser('author');
        $article = Article::factory()->create(['author_id' => $author->id]);

        $this->actingAs($author)
            ->postJson("/api/articles/{$article->id}/publish")
            ->assertForbidden();
    }

    public function test_author_cannot_edit_another_authors_article(): void
    {
        $author = $this->cmsUser('author');
        $other = $this->cmsUser('author', ['email' => 'other@example.com']);
        $article = Article::factory()->create(['author_id' => $other->id]);

        $this->actingAs($author)
            ->putJson("/api/articles/{$article->id}", ['title' => 'Hijacked'])
            ->assertForbidden();
    }

    public function test_editor_can_publish(): void
    {
        $editor = $this->cmsUser('editor');
        $article = Article::factory()->create(['author_id' => $editor->id]);

        $this->actingAs($editor)
            ->postJson("/api/articles/{$article->id}/publish")
            ->assertOk()
            ->assertJsonPath('data.status', 'published');
    }

    public function test_author_cannot_manage_users(): void
    {
        $author = $this->cmsUser('author');

        $this->actingAs($author)
            ->getJson('/api/users')
            ->assertForbidden();
    }
}
