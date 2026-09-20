<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'name',
    'email',
    'message',
    'ip_address',
    'user_agent',
    'read_at',
])]
class ContactMessage extends Model
{
    protected $table = 'contact_messages';

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
