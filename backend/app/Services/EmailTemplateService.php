<?php

namespace App\Services;

use App\Models\EmailTemplate;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;

class EmailTemplateService
{
    private const BRAND_ORANGE = '#c45c26';

    private const DEFAULT_EMBLEM = '/logos/ink-voltage-mark-148.png';

    private const EMBLEM_CID = 'ink-voltage-emblem';

    public function __construct(
        private readonly ResendMailService $mail,
        private readonly SettingsService $settings,
    ) {}

    public function all(): Collection
    {
        return EmailTemplate::query()->orderBy('name')->get();
    }

    public function findBySlug(string $slug): ?EmailTemplate
    {
        return EmailTemplate::query()->where('slug', $slug)->first();
    }

    public function create(array $data): EmailTemplate
    {
        $slug = $data['slug'] ?? Str::slug($data['name']);
        $slug = $this->uniqueSlug($slug);

        return EmailTemplate::query()->create([
            'slug' => $slug,
            'name' => $data['name'],
            'subject' => $data['subject'],
            'html_body' => $data['html_body'],
            'description' => $data['description'] ?? null,
            'is_system' => false,
        ]);
    }

    public function update(EmailTemplate $template, array $data): EmailTemplate
    {
        if (isset($data['slug']) && $data['slug'] !== $template->slug) {
            if ($template->is_system) {
                unset($data['slug']);
            } else {
                $data['slug'] = $this->uniqueSlug($data['slug'], $template->id);
            }
        }

        $template->fill(collect($data)->only([
            'slug', 'name', 'subject', 'html_body', 'description',
        ])->all());
        $template->save();

        return $template->refresh();
    }

    public function delete(EmailTemplate $template): void
    {
        if ($template->is_system) {
            throw new InvalidArgumentException('System templates cannot be deleted.');
        }

        $template->delete();
    }

    /**
     * @param  'preview'|'send'  $mode
     * @return array{subject: string, html: string, attachments: list<array<string, string>>}
     */
    public function preview(EmailTemplate $template, array $vars = [], string $mode = 'preview'): array
    {
        $siteName = (string) ($vars['site_name']
            ?? $this->settings->get('site_name')
            ?? config('mail.from.name')
            ?? 'Ink & Voltage');

        $siteNameHtml = $this->brandNameHtml($siteName);
        [$logoSrc, $attachments] = $this->resolveLogoForMode($mode, $vars['logo_url'] ?? null);
        $logoBlock = $this->buildLogoBlock($logoSrc, $siteNameHtml);

        $defaults = [
            'email' => $vars['email'] ?? 'reader@example.com',
            'site_name' => $siteName,
            'site_name_html' => $siteNameHtml,
            'year' => (string) now()->year,
            'logo_url' => $logoSrc,
            'logo_block' => $logoBlock,
            'site_url' => rtrim((string) ($this->settings->get('site_url') ?: config('app.url')), '/'),
        ];

        $rendered = $this->mail->render($template->subject, $template->html_body, array_merge($defaults, $vars, [
            'site_name' => $siteName,
            'site_name_html' => $siteNameHtml,
            'logo_url' => $logoSrc,
            'logo_block' => $logoBlock,
        ]));

        return [
            'subject' => $rendered['subject'],
            'html' => $rendered['html'],
            'attachments' => $attachments,
        ];
    }

    /** Orange & for email HTML. */
    public function brandNameHtml(string $name): string
    {
        $escaped = e($name);

        return (string) preg_replace(
            '/&amp;|&/u',
            '<span style="color:'.self::BRAND_ORANGE.';font-style:normal;font-weight:inherit;">&amp;</span>',
            $escaped,
            1
        );
    }

    private function buildLogoBlock(string $logoSrc, string $siteNameHtml): string
    {
        if ($logoSrc === '') {
            return '<p style="margin:0 0 18px;font-family:Georgia,\'Times New Roman\',serif;font-size:22px;font-weight:600;color:#f5f1ea;letter-spacing:-0.02em;">'.$siteNameHtml.'</p>';
        }

        return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border-collapse:collapse;">'
            .'<tr>'
            .'<td style="vertical-align:middle;padding:0 12px 0 0;">'
            .'<img src="'.e($logoSrc).'" alt="" width="48" height="48" style="display:block;width:48px;height:48px;border:0;outline:none;text-decoration:none;" />'
            .'</td>'
            .'<td style="vertical-align:middle;font-family:Georgia,\'Times New Roman\',serif;font-size:22px;font-weight:600;line-height:1.1;color:#f5f1ea;letter-spacing:-0.02em;">'
            .$siteNameHtml
            .'</td>'
            .'</tr></table>';
    }

    /**
     * @return array{0: string, 1: list<array<string, string>>}
     */
    private function resolveLogoForMode(string $mode, mixed $override): array
    {
        $publicHttps = $this->resolvePublicHttpsLogoUrl($override);
        $binary = $this->emblemBinary();

        // Prefer a real public https URL when configured (production).
        if ($publicHttps !== null) {
            return [$publicHttps, []];
        }

        if ($binary === null) {
            return ['', []];
        }

        if ($mode === 'send') {
            return [
                'cid:'.self::EMBLEM_CID,
                [[
                    'content' => base64_encode($binary),
                    'filename' => 'ink-voltage-emblem.png',
                    'content_type' => 'image/png',
                    'content_id' => self::EMBLEM_CID,
                ]],
            ];
        }

        // CMS preview iframe — data URI works locally without a public host.
        return ['data:image/png;base64,'.base64_encode($binary), []];
    }

    private function resolvePublicHttpsLogoUrl(mixed $override): ?string
    {
        $raw = is_string($override) && $override !== ''
            ? $override
            : (string) ($this->settings->get('email_logo_url')
                ?: $this->settings->get('organization_logo')
                ?: '');

        $raw = trim($raw);
        if ($raw === '') {
            return null;
        }

        if (str_starts_with($raw, 'https://')) {
            $host = parse_url($raw, PHP_URL_HOST) ?: '';
            if ($host !== '' && ! in_array(strtolower($host), ['localhost', '127.0.0.1'], true)) {
                return $raw;
            }
        }

        return null;
    }

    private function emblemBinary(): ?string
    {
        $candidates = [
            public_path('logos/ink-voltage-mark-148.png'),
            public_path('logos/ink-voltage-mark-256.png'),
            base_path('../frontend/public/logos/ink-voltage-mark-148.png'),
        ];

        foreach ($candidates as $path) {
            if (is_string($path) && is_file($path)) {
                $bytes = @file_get_contents($path);
                if (is_string($bytes) && $bytes !== '') {
                    return $bytes;
                }
            }
        }

        return null;
    }

    private function uniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug) ?: 'template';
        $candidate = $base;
        $i = 2;

        while (
            EmailTemplate::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = "{$base}-{$i}";
            $i++;
        }

        return $candidate;
    }
}
