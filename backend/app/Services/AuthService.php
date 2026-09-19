<?php

namespace App\Services;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    public function login(string $email, string $password): User
    {
        $user = User::query()->with('role.permissions')->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== UserStatus::Active) {
            throw ValidationException::withMessages([
                'email' => ['This account is not active.'],
            ]);
        }

        Auth::guard('web')->login($user);

        if (request()->hasSession()) {
            request()->session()->regenerate();
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $this->auditLogger->record('auth.login', $user, user: $user);

        return $user->fresh('role.permissions');
    }

    public function logout(): void
    {
        $user = Auth::user();
        if ($user) {
            $this->auditLogger->record('auth.logout', $user, user: $user);
            $token = $user->currentAccessToken();
            if ($token && method_exists($token, 'delete')) {
                $token->delete();
            }
        }

        Auth::guard('web')->logout();

        if (request()->hasSession()) {
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }
    }

    public function sendResetLink(string $email): string
    {
        return Password::sendResetLink(['email' => $email]);
    }

    public function resetPassword(array $credentials): string
    {
        return Password::reset($credentials, function (User $user, string $password) {
            $user->forceFill([
                'password' => $password,
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
            $this->auditLogger->record('auth.password_reset', $user, user: $user);
        });
    }
}
