<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'articles.view' => 'View articles',
            'articles.create' => 'Create articles',
            'articles.edit' => 'Edit articles',
            'articles.delete' => 'Delete articles',
            'articles.publish' => 'Publish articles',
            'categories.manage' => 'Manage categories',
            'tags.manage' => 'Manage tags',
            'media.manage' => 'Manage media',
            'gallery.manage' => 'Manage photography & painting galleries',
            'users.view' => 'View users',
            'users.create' => 'Create users',
            'users.edit' => 'Edit users',
            'users.delete' => 'Delete users',
            'settings.manage' => 'Manage settings',
        ];

        $permissionModels = collect($permissions)->mapWithKeys(function (string $name, string $slug) {
            return [$slug => Permission::query()->updateOrCreate(['slug' => $slug], ['name' => $name])];
        });

        $roles = [
            'super-admin' => ['name' => 'Super Admin', 'permissions' => array_keys($permissions)],
            'admin' => ['name' => 'Admin', 'permissions' => array_keys($permissions)],
            'editor' => [
                'name' => 'Editor',
                'permissions' => [
                    'articles.view', 'articles.create', 'articles.edit', 'articles.delete', 'articles.publish',
                    'categories.manage', 'tags.manage', 'media.manage', 'gallery.manage',
                ],
            ],
            'author' => [
                'name' => 'Author',
                'permissions' => [
                    'articles.view', 'articles.create', 'articles.edit',
                    'media.manage', 'gallery.manage',
                ],
            ],
        ];

        foreach ($roles as $slug => $config) {
            $role = Role::query()->updateOrCreate(['slug' => $slug], ['name' => $config['name']]);
            $role->permissions()->sync(
                $permissionModels->only($config['permissions'])->pluck('id')->all()
            );
        }
    }
}
