<?php

namespace Database\Seeders;

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::query()->where('slug', 'super-admin')->firstOrFail();

        $joyeeta = User::query()->updateOrCreate(
            ['email' => 'joyeeta@blogcms.test'],
            [
                'name' => 'Joyeeta',
                'slug' => 'joyeeta',
                'password' => Hash::make('password'),
                'role_id' => $role->id,
                'bio' => 'Super admin of Ink & Voltage.',
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]
        );

        // Point content ownership at Joyeeta before removing other users.
        DB::table('articles')->update(['author_id' => $joyeeta->id]);
        DB::table('media')->whereNotNull('uploaded_by')->update(['uploaded_by' => $joyeeta->id]);
        DB::table('gallery_works')->whereNotNull('uploaded_by')->update(['uploaded_by' => $joyeeta->id]);
        DB::table('article_revisions')->whereNotNull('user_id')->update(['user_id' => $joyeeta->id]);
        DB::table('audit_logs')->whereNotNull('user_id')->update(['user_id' => $joyeeta->id]);

        User::query()->where('id', '!=', $joyeeta->id)->forceDelete();
    }
}
