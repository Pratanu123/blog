<?php

namespace App\Http\Requests\Comment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage', \App\Models\ContentComment::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'target_type' => ['sometimes', Rule::in(['article', 'gallery_work'])],
            'target_id' => ['sometimes', 'integer', 'min:1'],
            'author_name' => ['sometimes', 'string', 'max:120'],
            'author_email' => ['nullable', 'email', 'max:180'],
            'body' => ['sometimes', 'string', 'max:5000'],
            'is_approved' => ['sometimes', 'boolean'],
        ];
    }
}
