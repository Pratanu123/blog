<?php

namespace App\Policies;

use App\Models\User;

class EmailCampaignPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('campaigns.manage') || $user->hasPermission('settings.manage');
    }

    public function manage(User $user): bool
    {
        return $user->hasPermission('campaigns.manage') || $user->hasPermission('settings.manage');
    }
}
