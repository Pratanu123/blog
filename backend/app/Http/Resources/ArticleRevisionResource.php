<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ArticleRevision */
class ArticleRevisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'article_id' => $this->article_id,
            'user' => new UserResource($this->whenLoaded('user')),
            'title' => $this->title,
            'content' => $this->content,
            'excerpt' => $this->excerpt,
            'revision_number' => $this->revision_number,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
