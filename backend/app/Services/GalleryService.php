<?php

namespace App\Services;

use App\Enums\GalleryType;
use App\Models\GalleryWork;
use App\Models\User;
use App\Support\SlugGenerator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class GalleryService
{
    public function __construct(
        private readonly SlugGenerator $slugs,
        private readonly AuditLogger $auditLogger,
    ) {}

    public function paginate(GalleryType $type, array $filters, bool $publishedOnly = false): LengthAwarePaginator
    {
        return GalleryWork::query()
            ->with('uploader:id,name')
            ->where('type', $type)
            ->when($publishedOnly, fn ($query) => $query->where('is_published', true))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('title', 'like', "%{$search}%")
                        ->orWhere('short_description', 'like', "%{$search}%")
                        ->orWhere('alt_text', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->orderByDesc('created_at')
            ->paginate((int) ($filters['per_page'] ?? 24));
    }

    public function create(GalleryType $type, array $data, UploadedFile $file, User $actor): GalleryWork
    {
        $stored = $this->storeFile($type, $file);

        $work = GalleryWork::query()->create([
            'type' => $type,
            'title' => $data['title'],
            'slug' => $this->slugs->unique($data['slug'] ?? $data['title'], GalleryWork::class),
            'short_description' => $data['short_description'] ?? null,
            'description' => $data['description'] ?? null,
            'alt_text' => $data['alt_text'] ?? null,
            'filename' => $stored['filename'],
            'original_filename' => $stored['original_filename'],
            'mime_type' => $stored['mime_type'],
            'size' => $stored['size'],
            'path' => $stored['path'],
            'is_published' => (bool) ($data['is_published'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'uploaded_by' => $actor->id,
        ]);

        $this->auditLogger->record('gallery.created', $work, user: $actor);

        return $work->fresh('uploader');
    }

    public function update(GalleryWork $work, array $data, User $actor, ?UploadedFile $file = null): GalleryWork
    {
        if ($file) {
            $stored = $this->storeFile($work->type, $file);
            Storage::disk('public')->delete($work->path);
            $work->fill([
                'filename' => $stored['filename'],
                'original_filename' => $stored['original_filename'],
                'mime_type' => $stored['mime_type'],
                'size' => $stored['size'],
                'path' => $stored['path'],
            ]);
        }

        $title = $data['title'] ?? $work->title;
        $work->fill([
            'title' => $title,
            'slug' => $this->slugs->unique($data['slug'] ?? $title, GalleryWork::class, $work->id),
            'short_description' => array_key_exists('short_description', $data)
                ? $data['short_description']
                : $work->short_description,
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $work->description,
            'alt_text' => array_key_exists('alt_text', $data)
                ? $data['alt_text']
                : $work->alt_text,
            'is_published' => array_key_exists('is_published', $data)
                ? (bool) $data['is_published']
                : $work->is_published,
            'sort_order' => array_key_exists('sort_order', $data)
                ? (int) $data['sort_order']
                : $work->sort_order,
        ])->save();

        $this->auditLogger->record('gallery.updated', $work, user: $actor);

        return $work->fresh('uploader');
    }

    public function delete(GalleryWork $work, User $actor): void
    {
        Storage::disk('public')->delete($work->path);
        $this->auditLogger->record('gallery.deleted', $work, ['title' => $work->title], user: $actor);
        $work->delete();
    }

    /**
     * @return array{filename: string, original_filename: string, mime_type: string, size: int, path: string}
     */
    private function storeFile(GalleryType $type, UploadedFile $file): array
    {
        $this->assertSafeUpload($file);

        $directory = 'gallery/'.$type->value.'/'.now()->format('Y/m');
        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs($directory, $filename, 'public');

        if (! $path) {
            throw new RuntimeException('Unable to store uploaded file.');
        }

        return [
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: $file->getClientMimeType(),
            'size' => (int) $file->getSize(),
            'path' => $path,
        ];
    }

    private function assertSafeUpload(UploadedFile $file): void
    {
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
        $mime = $file->getMimeType() ?: $file->getClientMimeType();
        $extension = strtolower($file->getClientOriginalExtension());

        if (! in_array($mime, $allowedMimes, true) || ! in_array($extension, $allowedExt, true)) {
            throw new RuntimeException('Unsupported image type.');
        }

        if ($file->getSize() > 8 * 1024 * 1024) {
            throw new RuntimeException('The image exceeds the 8MB size limit.');
        }

        if ($mime !== 'image/svg+xml') {
            $info = @getimagesize($file->getRealPath());
            if ($info === false) {
                throw new RuntimeException('The file is not a valid image.');
            }
        }
    }
}
