<?php

namespace App\Policies;

use App\Models\User;

class ContactMessagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('contact.manage') || $user->hasPermission('settings.manage');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('contact.manage') || $user->hasPermission('settings.manage');
    }
}
