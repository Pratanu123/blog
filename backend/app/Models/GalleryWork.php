<?php

namespace App\Models;

use App\Enums\GalleryType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'type',
    'title',
    'slug',
    'short_description',
    'description',
    'alt_text',
    'filename',
    'original_filename',
    'mime_type',
    'size',
    'path',
    'is_published',
    'sort_order',
    'uploaded_by',
])]
class GalleryWork extends Model
{
    protected $table = 'gallery_works';

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'type' => GalleryType::class,
            'is_published' => 'boolean',
            'size' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return '/storage/'.ltrim((string) $this->path, '/');
    }
}
