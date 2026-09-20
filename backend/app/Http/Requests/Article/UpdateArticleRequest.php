<?php

namespace App\Http\Requests\Article;

use App\Enums\ArticleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('article')) ?? false;
    }

    public function rules(): array
    {
        $article = $this->route('article');

        return [
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'slug' => ['nullable', 'string', 'max:220', Rule::unique('articles', 'slug')->ignore($article?->id)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'featured_image_id' => ['nullable', 'integer', 'exists:media,id'],
            'author_name' => ['nullable', 'string', 'max:120'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
            'status' => ['nullable', Rule::enum(ArticleStatus::class)],
            'published_at' => ['nullable', 'date'],
            'scheduled_at' => ['nullable', 'date'],
            'meta_title' => ['nullable', 'string', 'max:70'],
            'meta_description' => ['nullable', 'string', 'max:180'],
            'canonical_url' => ['nullable', 'url', 'max:255'],
            'og_title' => ['nullable', 'string', 'max:70'],
            'og_description' => ['nullable', 'string', 'max:180'],
            'og_image_id' => ['nullable', 'integer', 'exists:media,id'],
            'twitter_card' => ['nullable', 'in:summary,summary_large_image'],
        ];
    }
}
