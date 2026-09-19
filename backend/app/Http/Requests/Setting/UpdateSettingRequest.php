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
            'default_og_image' => ['nullable', 'string', 'max:255'],
            'twitter_handle' => ['nullable', 'string', 'max:50'],
            'contact_email' => ['nullable', 'email', 'max:180'],
            'about_content' => ['nullable', 'string'],
            'about_me_content' => ['nullable', 'string'],
            'newsletter_enabled' => ['nullable', 'string', 'max:10'],
            'robots_custom' => ['nullable', 'string'],
        ];
    }
}
