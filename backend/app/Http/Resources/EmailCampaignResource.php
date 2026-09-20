<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\EmailCampaign */
class EmailCampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status,
            'sent_count' => (int) $this->sent_count,
            'failed_count' => (int) $this->failed_count,
            'sent_at' => optional($this->sent_at)?->toISOString(),
            'scheduled_at' => optional($this->scheduled_at)?->toISOString(),
            'created_at' => optional($this->created_at)?->toISOString(),
            'template' => $this->whenLoaded('template', fn () => [
                'id' => $this->template->id,
                'name' => $this->template->name,
                'slug' => $this->template->slug,
                'subject' => $this->template->subject,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
            'recipients' => $this->whenLoaded('recipients', fn () => $this->recipients->map(fn ($r) => [
                'id' => $r->id,
                'email' => $r->email,
                'status' => $r->status,
                'error' => $r->error,
                'sent_at' => optional($r->sent_at)?->toISOString(),
            ])),
        ];
    }
}
