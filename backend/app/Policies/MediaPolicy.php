<?php

namespace App\Policies;

use App\Models\User;

class MediaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('media.manage') || $user->hasPermission('articles.edit') || $user->hasPermission('articles.create');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('media.manage');
    }
}
