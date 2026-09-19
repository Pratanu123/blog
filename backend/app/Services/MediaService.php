<?php

namespace App\Services;

use App\Jobs\ProcessImage;
use App\Models\Media;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class MediaService
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        return Media::query()
            ->with('uploader:id,name')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('original_filename', 'like', "%{$search}%")
                        ->orWhere('alt_text', 'like', "%{$search}%")
                        ->orWhere('filename', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate((int) ($filters['per_page'] ?? 24));
    }

    public function upload(UploadedFile $file, User $actor, ?string $altText = null): Media
    {
        $this->assertSafeUpload($file);

        $directory = 'media/'.now()->format('Y/m');
        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs($directory, $filename, 'public');

        if (! $path) {
            throw new RuntimeException('Unable to store uploaded file.');
        }

        $media = Media::query()->create([
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: $file->getClientMimeType(),
            'size' => $file->getSize(),
            'path' => $path,
            'alt_text' => $altText,
            'uploaded_by' => $actor->id,
        ]);

        ProcessImage::dispatch($media->id);
        $this->auditLogger->record('media.uploaded', $media, user: $actor);

        return $media->fresh('uploader');
    }

    public function update(Media $media, array $data, User $actor): Media
    {
        $media->fill($data)->save();
        $this->auditLogger->record('media.updated', $media, user: $actor);

        return $media;
    }

    public function delete(Media $media, User $actor): void
    {
        Storage::disk('public')->delete($media->path);
        $this->auditLogger->record('media.deleted', $media, ['filename' => $media->filename], user: $actor);
        $media->delete();
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
