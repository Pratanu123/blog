<?php

namespace App\Policies;

use App\Models\User;

class ContentCommentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('comments.manage') || $user->hasPermission('articles.view');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('comments.manage');
    }
}
