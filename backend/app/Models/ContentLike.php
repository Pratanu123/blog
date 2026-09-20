<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'target_type',
    'target_id',
    'visitor_key',
])]
class ContentLike extends Model
{
    protected $table = 'content_likes';
}
