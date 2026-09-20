<?php

namespace App\Http\Requests\Comment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', \App\Models\ContentComment::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'target_type' => ['required', Rule::in(['article', 'gallery_work'])],
            'target_id' => ['required', 'integer', 'min:1'],
            'author_name' => ['required', 'string', 'max:120'],
            'author_email' => ['nullable', 'email', 'max:180'],
            'body' => ['required', 'string', 'max:5000'],
            'is_approved' => ['sometimes', 'boolean'],
        ];
    }
}
