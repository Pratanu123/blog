<?php

namespace App\Http\Resources;

use App\Services\AdminCommentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ContentComment */
class ContentCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var AdminCommentService $labels */
        $labels = app(AdminCommentService::class);

        return [
            'id' => $this->id,
            'target_type' => $this->target_type,
            'target_id' => $this->target_id,
            'target_title' => $labels->targetLabel($this->target_type, (int) $this->target_id),
            'target_url' => $labels->targetUrl($this->target_type, (int) $this->target_id),
            'author_name' => $this->author_name,
            'author_email' => $this->author_email,
            'body' => $this->body,
            'is_approved' => (bool) $this->is_approved,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
