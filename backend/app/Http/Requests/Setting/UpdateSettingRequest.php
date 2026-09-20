<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', \App\Models\Setting::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'site_name' => ['nullable', 'string', 'max:120'],
            'site_description' => ['nullable', 'string', 'max:300'],
            'site_url' => ['nullable', 'url', 'max:255'],
            'organization_name' => ['nullable', 'string', 'max:120'],
            'organization_logo' => ['nullable', 'string', 'max:255'],
            'email_logo_url' => ['nullable', 'string', 'max:500'],
            'default_og_image' => ['nullable', 'string', 'max:255'],
            'twitter_handle' => ['nullable', 'string', 'max:50'],
            'contact_email' => ['nullable', 'email', 'max:180'],
            'newsletter_enabled' => ['nullable', 'string', 'max:10'],
            'allow_right_click' => ['nullable', 'string', 'max:10'],
            'robots_custom' => ['nullable', 'string'],

            // Welcome Hall
            'welcome_eyebrow' => ['nullable', 'string', 'max:120'],
            'welcome_title' => ['nullable', 'string', 'max:200'],
            'welcome_subtitle' => ['nullable', 'string', 'max:400'],
            'welcome_doors' => ['nullable', 'array', 'max:12'],
            'welcome_doors.*.to' => ['required_with:welcome_doors', 'string', 'max:120'],
            'welcome_doors.*.label' => ['required_with:welcome_doors', 'string', 'max:120'],
            'welcome_doors.*.hint' => ['nullable', 'string', 'max:200'],

            // Blog Inspiration
            'inspiration_eyebrow' => ['nullable', 'string', 'max:120'],
            'inspiration_title' => ['nullable', 'string', 'max:200'],
            'inspiration_footer' => ['nullable', 'string', 'max:120'],
            'inspiration_thoughts' => ['nullable', 'array', 'max:24'],
            'inspiration_thoughts.*' => ['nullable', 'string', 'max:500'],
            'about_content' => ['nullable', 'string'],

            // About Me
            'about_me_greeting' => ['nullable', 'string', 'max:120'],
            'about_me_letter' => ['nullable', 'string', 'max:2000'],
            'about_me_signoff' => ['nullable', 'string', 'max:80'],
            'about_me_signature' => ['nullable', 'string', 'max:80'],
            'about_me_puzzle_hint' => ['nullable', 'string', 'max:300'],
            'about_me_content' => ['nullable', 'string'],

            // Contact
            'contact_title' => ['nullable', 'string', 'max:120'],
            'contact_intro' => ['nullable', 'string', 'max:500'],
            'contact_submit_label' => ['nullable', 'string', 'max:80'],
            'contact_success_message' => ['nullable', 'string', 'max:300'],

            // Sunday Dispatch (footer newsletter)
            'dispatch_title' => ['nullable', 'string', 'max:120'],
            'dispatch_subtitle' => ['nullable', 'string', 'max:400'],
            'dispatch_placeholder' => ['nullable', 'string', 'max:120'],
            'dispatch_button_label' => ['nullable', 'string', 'max:80'],
        ];
    }
}
