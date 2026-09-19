<?php

namespace Tests;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function cmsUser(string $role = 'admin', array $attributes = []): User
    {
        $this->seed(RolePermissionSeeder::class);

        return User::factory()->create([
            'role_id' => Role::query()->where('slug', $role)->value('id'),
            ...$attributes,
        ])->load('role.permissions');
    }
}
