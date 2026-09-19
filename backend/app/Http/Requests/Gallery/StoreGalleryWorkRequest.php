<?php

namespace App\Http\Requests\Gallery;

use App\Enums\GalleryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGalleryWorkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\GalleryWork::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(GalleryType::class)],
            'title' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:180'],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string', 'max:5000'],
            'alt_text' => ['nullable', 'string', 'max:180'],
            'is_published' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'file' => ['required', 'file', 'max:8192', 'mimes:jpg,jpeg,png,webp,svg'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_published')) {
            $this->merge([
                'is_published' => filter_var($this->input('is_published'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }
    }
}
