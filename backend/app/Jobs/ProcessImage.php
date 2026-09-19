<?php

namespace App\Jobs;

use App\Models\Media;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessImage implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $mediaId) {}

    public function handle(): void
    {
        $media = Media::query()->find($this->mediaId);
        if (! $media || ! str_starts_with($media->mime_type, 'image/') || $media->mime_type === 'image/svg+xml') {
            return;
        }

        $absolute = Storage::disk('public')->path($media->path);
        if (! is_file($absolute) || ! function_exists('imagecreatefromstring')) {
            return;
        }

        $binary = file_get_contents($absolute);
        if ($binary === false) {
            return;
        }

        $image = @imagecreatefromstring($binary);
        if ($image === false) {
            return;
        }

        $width = imagesx($image);
        $maxWidth = 1600;
        if ($width > $maxWidth) {
            $height = imagesy($image);
            $newHeight = (int) round($height * ($maxWidth / $width));
            $resized = imagescale($image, $maxWidth, $newHeight);
            if ($resized !== false) {
                $this->writeImage($resized, $absolute, $media->mime_type);
                imagedestroy($resized);
            }
        }

        imagedestroy($image);
    }

    private function writeImage(\GdImage $image, string $path, string $mime): void
    {
        match ($mime) {
            'image/png' => imagepng($image, $path, 6),
            'image/webp' => function_exists('imagewebp') ? imagewebp($image, $path, 82) : imagejpeg($image, $path, 82),
            default => imagejpeg($image, $path, 82),
        };
    }
}
