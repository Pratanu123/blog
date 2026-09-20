<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['email', 'status', 'welcome_sent_at'])]
class NewsletterSubscriber extends Model
{
    protected function casts(): array
    {
        return [
            'welcome_sent_at' => 'datetime',
        ];
    }
}
