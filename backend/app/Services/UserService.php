<?php

namespace App\Services;

use App\Enums\UserStatus;
use App\Models\User;
use App\Support\SlugGenerator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserService
{
    public function __construct(
        private readonly SlugGenerator $slugs,
        private readonly AuditLogger $auditLogger,
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        return User::query()
            ->with('role')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['role_id'] ?? null, fn ($query, $roleId) => $query->where('role_id', $roleId))
            ->latest()
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function create(array $data, $actor): User
    {
        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role_id' => $data['role_id'],
            'slug' => $this->slugs->unique($data['slug'] ?? $data['name'], User::class),
            'bio' => $data['bio'] ?? null,
            'avatar' => $data['avatar'] ?? null,
            'status' => $data['status'] ?? UserStatus::Active->value,
        ]);

        $this->auditLogger->record('user.created', $user, user: $actor);

        return $user->fresh('role.permissions');
    }

    public function update(User $user, array $data, $actor): User
    {
        $old = $user->only(['name', 'email', 'role_id', 'status']);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        if (isset($data['name']) || isset($data['slug'])) {
            $data['slug'] = $this->slugs->unique($data['slug'] ?? $data['name'] ?? $user->name, User::class, $user->id);
        }

        $user->fill($data)->save();
        $this->auditLogger->record('user.updated', $user, $old, $user->only(['name', 'email', 'role_id', 'status']), $actor);

        return $user->fresh('role.permissions');
    }

    public function delete(User $user, $actor): void
    {
        $this->auditLogger->record('user.deleted', $user, $user->only(['email']), user: $actor);
        $user->delete();
    }
}
