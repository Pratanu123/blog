<?php

namespace App\Http\Requests\User;

use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', \App\Models\User::class) ?? false;
    }

    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'email' => ['sometimes', 'required', 'email', 'max:180', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => ['nullable', Password::min(8)],
            'role_id' => ['sometimes', 'required', 'integer', 'exists:roles,id'],
            'slug' => ['nullable', 'string', 'max:140', Rule::unique('users', 'slug')->ignore($user?->id)],
            'bio' => ['nullable', 'string', 'max:1000'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(UserStatus::class)],
        ];
    }
}
