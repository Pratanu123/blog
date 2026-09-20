<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Services\ContactMessageService;
use App\Services\EmailCampaignService;
use App\Services\SettingsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ContactController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly ContactMessageService $contactMessages,
        private readonly EmailCampaignService $campaigns,
    ) {}

    public function contact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $this->contactMessages->store([
            ...$data,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
        ]);

        $to = $this->settings->get('contact_email', config('mail.from.address'));

        try {
            Mail::raw(
                "From: {$data['name']} <{$data['email']}>\n\n{$data['message']}",
                function ($message) use ($to, $data) {
                    $message->to($to)->replyTo($data['email'], $data['name'])->subject('Contact form message');
                }
            );
        } catch (Throwable $exception) {
            Log::warning('Contact form email failed', [
                'email' => $data['email'],
                'error' => $exception->getMessage(),
            ]);
        }

        Log::info('Contact form submitted', ['email' => $data['email']]);

        return ApiResponse::success(null, 'Message sent successfully');
    }

    public function newsletter(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:180'],
        ]);

        $subscriber = NewsletterSubscriber::query()->firstOrCreate(
            ['email' => $data['email']],
            ['status' => 'active']
        );

        if ($subscriber->status !== 'active') {
            $subscriber->update(['status' => 'active']);
        }

        // Retry welcome until Resend accepts it (e.g. after fixing from-domain)
        if (! $subscriber->welcome_sent_at) {
            if ($this->campaigns->sendWelcome($subscriber)) {
                $subscriber->update(['welcome_sent_at' => now()]);
            }
        }

        return ApiResponse::success(null, 'Subscribed successfully');
    }
}
