<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Article */
class ArticleCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'status' => $this->status?->value ?? $this->status,
            'published_at' => $this->published_at,
            'scheduled_at' => $this->scheduled_at,
            'reading_time' => $this->reading_time,
            'views' => $this->views,
            'author_name' => $this->author_name,
            'author' => new UserResource($this->whenLoaded('author')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'featured_image' => $this->when(
                $this->relationLoaded('featuredImage'),
                fn () => $this->featuredImage ? new MediaResource($this->featuredImage) : null,
            ),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'updated_at' => $this->updated_at,
        ];
    }
}
