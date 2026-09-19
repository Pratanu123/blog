<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_and_delete_image(): void
    {
        Storage::fake('public');
        $admin = $this->cmsUser();

        $file = UploadedFile::fake()->image('cover.jpg', 800, 500);

        $response = $this->actingAs($admin)->post('/api/media', [
            'file' => $file,
            'alt_text' => 'Cover image',
        ], ['Accept' => 'application/json']);

        $response->assertCreated()->assertJsonPath('success', true);
        $id = $response->json('data.id');
        Storage::disk('public')->assertExists($response->json('data.path'));

        $this->actingAs($admin)->deleteJson("/api/media/{$id}")->assertOk();
        $this->assertDatabaseMissing('media', ['id' => $id]);
    }

    public function test_unsupported_file_is_rejected(): void
    {
        Storage::fake('public');
        $admin = $this->cmsUser();
        $file = UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf');

        $this->actingAs($admin)
            ->post('/api/media', ['file' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }
}
