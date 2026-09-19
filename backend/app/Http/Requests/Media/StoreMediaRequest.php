<?php

namespace App\Http\Requests\Media;

use Illuminate\Foundation\Http\FormRequest;

class StoreMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', \App\Models\Media::class)
            || $this->user()?->can('create', \App\Models\Article::class)
            || $this->user()?->can('update', \App\Models\Article::class);
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:8192', 'mimes:jpg,jpeg,png,webp,svg'],
            'alt_text' => ['nullable', 'string', 'max:180'],
        ];
    }
}
