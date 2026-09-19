<?php

namespace App\Policies;

use App\Models\User;

class TagPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('tags.manage') || $user->hasPermission('articles.view');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('tags.manage');
    }
}
