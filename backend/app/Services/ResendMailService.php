<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Resend;
use Resend\Exceptions\ErrorException;
use RuntimeException;
use Throwable;

class ResendMailService
{
    /**
     * @param  list<array<string, string>>  $attachments
     */
    public function send(string $to, string $subject, string $html, array $attachments = []): array
    {
        $apiKey = config('services.resend.key');
        if (! is_string($apiKey) || $apiKey === '') {
            throw new RuntimeException('RESEND_API_KEY is not configured.');
        }

        $fromAddress = (string) config('mail.from.address', 'onboarding@resend.dev');
        if ($fromAddress === '' || str_contains($fromAddress, 'example.com')) {
            $fromAddress = 'onboarding@resend.dev';
        }
        $fromName = (string) config('mail.from.name', config('app.name', 'Ink & Voltage'));
        if ($fromName === '' || $fromName === 'BlogCMS') {
            $fromName = 'Ink & Voltage';
        }
        $from = trim("{$fromName} <{$fromAddress}>");

        $payload = [
            'from' => $from,
            'to' => $to,
            'subject' => $subject,
            'html' => $html,
        ];

        if ($attachments !== []) {
            $payload['attachments'] = $attachments;
        }

        try {
            $resend = Resend::client($apiKey);
            $result = $resend->emails->send($payload);
        } catch (ErrorException $exception) {
            Log::warning('Resend API error', [
                'to' => $to,
                'error' => $exception->getMessage(),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            Log::warning('Resend send failed', [
                'to' => $to,
                'error' => $exception->getMessage(),
            ]);
            throw $exception;
        }

        $id = is_object($result) && isset($result->id)
            ? (string) $result->id
            : (is_array($result) ? (string) ($result['id'] ?? '') : '');

        return [
            'id' => $id,
            'to' => $to,
        ];
    }

    public function render(string $subject, string $html, array $vars = []): array
    {
        $replacements = [];
        foreach ($vars as $key => $value) {
            $replacements['{{'.$key.'}}'] = (string) $value;
        }

        return [
            'subject' => strtr($subject, $replacements),
            'html' => strtr($html, $replacements),
        ];
    }
}
