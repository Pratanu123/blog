<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'target_type',
    'target_id',
    'author_name',
    'author_email',
    'body',
    'is_approved',
])]
class ContentComment extends Model
{
    protected $table = 'content_comments';

    protected function casts(): array
    {
        return [
            'is_approved' => 'boolean',
        ];
    }
}
