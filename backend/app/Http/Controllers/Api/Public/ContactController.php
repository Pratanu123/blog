<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Services\SettingsService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function __construct(private readonly SettingsService $settings) {}

    public function contact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $to = $this->settings->get('contact_email', config('mail.from.address'));

        Mail::raw(
            "From: {$data['name']} <{$data['email']}>\n\n{$data['message']}",
            function ($message) use ($to, $data) {
                $message->to($to)->replyTo($data['email'], $data['name'])->subject('Contact form message');
            }
        );

        Log::info('Contact form submitted', ['email' => $data['email']]);

        return ApiResponse::success(null, 'Message sent successfully');
    }

    public function newsletter(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:180'],
        ]);

        NewsletterSubscriber::query()->firstOrCreate(
            ['email' => $data['email']],
            ['status' => 'active']
        );

        return ApiResponse::success(null, 'Subscribed successfully');
    }
}
