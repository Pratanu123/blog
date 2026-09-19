<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'site_name' => 'Ink & Voltage',
            'site_description' => 'A modern editorial magazine for software, design, and the systems that hold them together.',
            'site_url' => 'http://localhost',
            'organization_name' => 'Ink & Voltage',
            'organization_logo' => '',
            'default_og_image' => '',
            'twitter_handle' => '@inkvoltage',
            'contact_email' => 'hello@blogcms.test',
            'about_content' => 'Ink & Voltage is an independent editorial project. We publish long-form writing on software, design, and the quieter decisions that make products last.',
            'about_me_content' => "I write and edit for Ink & Voltage — an independent journal for software, design, and the quieter craft behind lasting work.\n\nBy day I sit with drafts, photographs, and paintings; by evening I chase the sentence that makes a system feel human. This site is my studio wall: essays in the Journal, photographs and paintings in their own galleries, and a running set of ideas that keep the work honest.\n\nIf you are here looking for polish without the performance, you are in the right room.",
            'newsletter_enabled' => '1',
            'robots_custom' => '',
        ];

        foreach ($settings as $key => $value) {
            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
