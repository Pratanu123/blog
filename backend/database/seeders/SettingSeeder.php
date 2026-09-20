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
            'organization_logo' => '/logos/ink-voltage-mark-512.png',
            'email_logo_url' => '/logos/ink-voltage-mark-148.png',
            'default_og_image' => '/logos/ink-voltage-og-1200x630.png',
            'twitter_handle' => '@inkvoltage',
            'contact_email' => 'hello@blogcms.test',
            'newsletter_enabled' => '1',
            'allow_right_click' => '0',
            'robots_custom' => '',

            'welcome_eyebrow' => 'You have arrived',
            'welcome_title' => 'Welcome to Ink & Voltage',
            'welcome_subtitle' => 'Choose a door. Each one leads somewhere the algorithm cannot invent for you.',
            'welcome_doors' => json_encode([
                ['to' => '/blog', 'label' => 'To the journal', 'hint' => 'Essays, systems, and long-form notes'],
                ['to' => '/photography', 'label' => 'To the photos', 'hint' => 'Light, place, and quiet frames'],
                ['to' => '/painting', 'label' => 'To the paintings', 'hint' => 'Colour, texture, and hand-made marks'],
                ['to' => '/about', 'label' => 'To the blog inspiration', 'hint' => 'Why this room exists'],
                ['to' => '/about-me', 'label' => 'To the about me', 'hint' => 'A puzzle, a letter, a person'],
            ], JSON_UNESCAPED_UNICODE),

            'inspiration_eyebrow' => 'Blog Inspiration',
            'inspiration_title' => 'Thoughts rising from the newsroom',
            'inspiration_footer' => 'Editor at the desk',
            'inspiration_thoughts' => json_encode([
                'Ink & Voltage is an independent editorial project — long-form writing on software, design, and the systems underneath both.',
                'We still believe a sentence can carry more weight than a dashboard full of metrics.',
                'The quieter decisions are usually the ones that make products last.',
                'Editors want a quiet room with the right levers in reach, not another control panel.',
                'Publish when the thought is ready. Not when the calendar asks.',
                'A magazine should feel like a mind at work — curious, unfinished, and alive.',
                'Design is the way an idea arrives before anyone has to explain it.',
                'Stay with the draft until the words start answering back.',
            ], JSON_UNESCAPED_UNICODE),
            'about_content' => 'Ink & Voltage is an independent editorial project. We publish long-form writing on software, design, and the quieter decisions that make products last.',

            'about_me_greeting' => 'Dear You,',
            'about_me_letter' => 'This puzzle is pretty much an accurate representation of how my personality is. See if you can match the correct pieces to uncover a little bit about me!',
            'about_me_signoff' => 'XoXo',
            'about_me_signature' => 'Joe',
            'about_me_puzzle_hint' => 'Tap a piece to enlarge its text. Tap again to shrink, then drag it into the frame.',
            'about_me_content' => "I write and edit for Ink & Voltage — an independent journal for software, design, and the quieter craft behind lasting work.\n\nBy day I sit with drafts, photographs, and paintings; by evening I chase the sentence that makes a system feel human. This site is my studio wall: essays in the Journal, photographs and paintings in their own galleries, and a running set of ideas that keep the work honest.\n\nIf you are here looking for polish without the performance, you are in the right room.",

            'contact_title' => 'Write to us',
            'contact_intro' => 'Send a note to the newsroom. Names, links, and quiet ideas welcome.',
            'contact_submit_label' => 'Send',
            'contact_success_message' => 'Message sent — thank you.',

            'dispatch_title' => 'The Sunday dispatch',
            'dispatch_subtitle' => 'One letter. No noise. Unsubscribe whenever the weather changes.',
            'dispatch_placeholder' => 'you@example.com',
            'dispatch_button_label' => 'Subscribe',
        ];

        foreach ($settings as $key => $value) {
            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
