<?php

namespace App\Services;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ContactMessageService
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    public function store(array $data): ContactMessage
    {
        return ContactMessage::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
            'ip_address' => $data['ip_address'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
        ]);
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = ContactMessage::query()->latest();

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if (($filters['status'] ?? '') === 'unread') {
            $query->whereNull('read_at');
        } elseif (($filters['status'] ?? '') === 'read') {
            $query->whereNotNull('read_at');
        }

        return $query->paginate((int) ($filters['per_page'] ?? 20));
    }

    public function markRead(ContactMessage $message, User $actor): ContactMessage
    {
        if (! $message->read_at) {
            $message->forceFill(['read_at' => now()])->save();
            $this->auditLogger->record('contact.read', $message, user: $actor);
        }

        return $message->fresh();
    }

    public function markUnread(ContactMessage $message, User $actor): ContactMessage
    {
        $message->forceFill(['read_at' => null])->save();
        $this->auditLogger->record('contact.unread', $message, user: $actor);

        return $message->fresh();
    }

    public function delete(ContactMessage $message, User $actor): void
    {
        $this->auditLogger->record('contact.deleted', $message, $message->toArray(), null, $actor);
        $message->delete();
    }

    public function unreadCount(): int
    {
        return ContactMessage::query()->whereNull('read_at')->count();
    }
}
