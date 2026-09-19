<?php

namespace App\Policies;

use App\Models\User;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('categories.manage') || $user->hasPermission('articles.view');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('categories.manage');
    }
}
