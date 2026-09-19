<?php

namespace App\Policies;

use App\Models\GalleryWork;
use App\Models\User;

class GalleryWorkPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('gallery.manage');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('gallery.manage');
    }

    public function create(User $user): bool
    {
        return $this->manage($user);
    }

    public function update(User $user, GalleryWork $galleryWork): bool
    {
        return $this->manage($user);
    }

    public function delete(User $user, GalleryWork $galleryWork): bool
    {
        return $this->manage($user);
    }
}
