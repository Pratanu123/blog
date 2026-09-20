<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Article */
class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->content,
            'status' => $this->status?->value ?? $this->status,
            'published_at' => $this->published_at,
            'scheduled_at' => $this->scheduled_at,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'canonical_url' => $this->canonical_url,
            'og_title' => $this->og_title,
            'og_description' => $this->og_description,
            'twitter_card' => $this->twitter_card,
            'reading_time' => $this->reading_time,
            'views' => $this->views,
            'author_name' => $this->author_name,
            'author' => new UserResource($this->whenLoaded('author')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'featured_image' => $this->when(
                $this->relationLoaded('featuredImage'),
                fn () => $this->featuredImage ? new MediaResource($this->featuredImage) : null,
            ),
            'og_image' => $this->when(
                $this->relationLoaded('ogImage'),
                fn () => $this->ogImage ? new MediaResource($this->ogImage) : null,
            ),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'revisions' => ArticleRevisionResource::collection($this->whenLoaded('revisions')),
            'related' => ArticleCardResource::collection($this->whenLoaded('related')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
