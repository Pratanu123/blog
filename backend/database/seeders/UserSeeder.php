<?php

namespace Database\Seeders;

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Amina Cole',
                'email' => 'superadmin@blogcms.test',
                'slug' => 'amina-cole',
                'role' => 'super-admin',
                'bio' => 'Founder of Ink & Voltage. Writes about systems, cities, and the long now.',
            ],
            [
                'name' => 'Julian Park',
                'email' => 'admin@blogcms.test',
                'slug' => 'julian-park',
                'role' => 'admin',
                'bio' => 'Operations lead who keeps the newsroom honest and the backlog short.',
            ],
            [
                'name' => 'Sofia Rahman',
                'email' => 'editor@blogcms.test',
                'slug' => 'sofia-rahman',
                'role' => 'editor',
                'bio' => 'Editor with a taste for precise sentences and ambitious reporting.',
            ],
            [
                'name' => 'Leo Hart',
                'email' => 'leo@blogcms.test',
                'slug' => 'leo-hart',
                'role' => 'author',
                'bio' => 'Backend engineer writing about PHP, queues, and quiet architecture.',
            ],
            [
                'name' => 'Maya Chen',
                'email' => 'maya@blogcms.test',
                'slug' => 'maya-chen',
                'role' => 'author',
                'bio' => 'Product designer exploring interfaces, type, and editorial systems.',
            ],
        ];

        foreach ($users as $data) {
            $role = Role::query()->where('slug', $data['role'])->firstOrFail();

            User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'slug' => $data['slug'],
                    'password' => Hash::make('password'),
                    'role_id' => $role->id,
                    'bio' => $data['bio'],
                    'status' => UserStatus::Active,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
