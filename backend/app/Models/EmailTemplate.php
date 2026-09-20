<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'subject', 'html_body', 'description', 'is_system'])]
class EmailTemplate extends Model
{
    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(EmailCampaign::class);
    }
}
