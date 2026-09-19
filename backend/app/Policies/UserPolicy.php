<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('users.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('users.create');
    }

    public function update(User $user): bool
    {
        return $user->hasPermission('users.edit');
    }

    public function delete(User $user, User $model): bool
    {
        return $user->hasPermission('users.delete') && $user->id !== $model->id;
    }
}
