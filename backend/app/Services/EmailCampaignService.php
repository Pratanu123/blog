<?php

namespace App\Services;

use App\Models\EmailCampaign;
use App\Models\EmailCampaignRecipient;
use App\Models\EmailTemplate;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class EmailCampaignService
{
    public function __construct(
        private readonly ResendMailService $mail,
        private readonly EmailTemplateService $templates,
    ) {}

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return EmailCampaign::query()
            ->with(['template:id,name,slug,subject', 'creator:id,name'])
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function create(array $data, User $actor): EmailCampaign
    {
        $template = EmailTemplate::query()->findOrFail($data['email_template_id']);
        $recipients = $this->resolveRecipientEmails($data);

        if ($recipients->isEmpty()) {
            abort(422, 'Add at least one subscriber or email address.');
        }

        $scheduledAt = ! empty($data['scheduled_at'])
            ? Carbon::parse($data['scheduled_at'])
            : null;

        $isScheduled = $scheduledAt && $scheduledAt->isFuture();

        $campaign = DB::transaction(function () use ($data, $actor, $template, $recipients, $scheduledAt, $isScheduled) {
            $campaign = EmailCampaign::query()->create([
                'name' => $data['name'],
                'email_template_id' => $template->id,
                'created_by' => $actor->id,
                'status' => $isScheduled ? 'scheduled' : 'sending',
                'scheduled_at' => $isScheduled ? $scheduledAt : null,
            ]);

            foreach ($recipients as $row) {
                EmailCampaignRecipient::query()->create([
                    'email_campaign_id' => $campaign->id,
                    'newsletter_subscriber_id' => $row['subscriber_id'],
                    'email' => $row['email'],
                    'status' => 'pending',
                ]);
            }

            return $campaign;
        });

        if ($isScheduled) {
            return $campaign->fresh(['template', 'creator', 'recipients']);
        }

        return $this->dispatchIndividualEmails($campaign->fresh(['template', 'recipients']));
    }

    /** @deprecated use create() */
    public function createAndSend(array $data, User $actor): EmailCampaign
    {
        return $this->create($data, $actor);
    }

    public function dispatchIndividualEmails(EmailCampaign $campaign, ?array $onlyRecipientIds = null): EmailCampaign
    {
        $template = $campaign->template;
        if (! $template) {
            $campaign->load('template');
            $template = $campaign->template;
        }

        $query = $campaign->recipients()->where('status', 'pending');
        if ($onlyRecipientIds !== null) {
            $query->whereIn('id', $onlyRecipientIds);
        }

        $sent = (int) $campaign->recipients()->where('status', 'sent')->count();
        $failed = 0;

        foreach ($query->cursor() as $recipient) {
            try {
                $rendered = $this->templates->preview($template, [
                    'email' => $recipient->email,
                ], 'send');

                $result = $this->mail->send(
                    $recipient->email,
                    $rendered['subject'],
                    $rendered['html'],
                    $rendered['attachments'] ?? [],
                );

                $recipient->update([
                    'status' => 'sent',
                    'resend_id' => $result['id'] ?: null,
                    'sent_at' => now(),
                    'error' => null,
                ]);
                $sent++;
            } catch (Throwable $exception) {
                $recipient->update([
                    'status' => 'failed',
                    'error' => Str::limit($exception->getMessage(), 500),
                ]);
                $failed++;
                Log::warning('Campaign recipient send failed', [
                    'campaign_id' => $campaign->id,
                    'email' => $recipient->email,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $failedTotal = (int) $campaign->recipients()->where('status', 'failed')->count();
        $pendingLeft = (int) $campaign->recipients()->where('status', 'pending')->count();
        $sentTotal = (int) $campaign->recipients()->where('status', 'sent')->count();

        $status = 'sent';
        if ($pendingLeft > 0) {
            $status = $campaign->status === 'scheduled' ? 'scheduled' : 'sending';
        } elseif ($failedTotal > 0 && $sentTotal === 0) {
            $status = 'failed';
        } elseif ($failedTotal > 0) {
            $status = 'partial';
        }

        $campaign->update([
            'status' => $status,
            'sent_count' => $sentTotal,
            'failed_count' => $failedTotal,
            'sent_at' => $sentTotal > 0 ? ($campaign->sent_at ?? now()) : $campaign->sent_at,
            'scheduled_at' => $pendingLeft === 0 ? null : $campaign->scheduled_at,
        ]);

        return $campaign->fresh(['template', 'creator', 'recipients']);
    }

    public function resendFailed(EmailCampaign $campaign): EmailCampaign
    {
        $failedIds = $campaign->recipients()->where('status', 'failed')->pluck('id');
        if ($failedIds->isEmpty()) {
            abort(422, 'No failed recipients to resend.');
        }

        $campaign->recipients()->whereIn('id', $failedIds)->update([
            'status' => 'pending',
            'error' => null,
            'resend_id' => null,
            'sent_at' => null,
        ]);

        $campaign->update(['status' => 'sending']);

        return $this->dispatchIndividualEmails($campaign->fresh(['template', 'recipients']), $failedIds->all());
    }

    public function resendRecipient(EmailCampaignRecipient $recipient): EmailCampaign
    {
        $recipient->update([
            'status' => 'pending',
            'error' => null,
            'resend_id' => null,
            'sent_at' => null,
        ]);

        $campaign = $recipient->campaign()->with(['template', 'recipients'])->firstOrFail();
        $campaign->update(['status' => 'sending']);

        return $this->dispatchIndividualEmails($campaign, [$recipient->id]);
    }

    public function sendDueScheduled(): int
    {
        $campaigns = EmailCampaign::query()
            ->with(['template', 'recipients'])
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get();

        $count = 0;
        foreach ($campaigns as $campaign) {
            $campaign->update(['status' => 'sending']);
            $this->dispatchIndividualEmails($campaign);
            $count++;
        }

        return $count;
    }

    public function sendWelcome(NewsletterSubscriber $subscriber): bool
    {
        $template = $this->templates->findBySlug('welcome');
        if (! $template) {
            Log::warning('Welcome email template missing');

            return false;
        }

        try {
            $rendered = $this->templates->preview($template, [
                'email' => $subscriber->email,
            ], 'send');
            $this->mail->send(
                $subscriber->email,
                $rendered['subject'],
                $rendered['html'],
                $rendered['attachments'] ?? [],
            );

            return true;
        } catch (Throwable $exception) {
            Log::warning('Welcome email failed', [
                'email' => $subscriber->email,
                'error' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    public function subscribers(array $filters = []): LengthAwarePaginator
    {
        return NewsletterSubscriber::query()
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where('email', 'like', "%{$search}%");
            })
            ->when(($filters['status'] ?? 'active') !== 'all', function ($query) use ($filters) {
                $query->where('status', $filters['status'] ?? 'active');
            })
            ->latest()
            ->paginate((int) ($filters['per_page'] ?? 100));
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{email: string, subscriber_id: int|null}>
     */
    private function resolveRecipientEmails(array $data)
    {
        $byEmail = collect();

        $subscriberIds = collect($data['subscriber_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->filter();
        if ($subscriberIds->isNotEmpty()) {
            NewsletterSubscriber::query()
                ->where('status', 'active')
                ->whereIn('id', $subscriberIds)
                ->get()
                ->each(function (NewsletterSubscriber $subscriber) use ($byEmail) {
                    $byEmail->put(Str::lower($subscriber->email), [
                        'email' => $subscriber->email,
                        'subscriber_id' => $subscriber->id,
                    ]);
                });
        }

        $extra = collect($data['emails'] ?? [])
            ->map(fn ($email) => trim((string) $email))
            ->filter()
            ->unique(fn ($email) => Str::lower($email));

        foreach ($extra as $email) {
            $key = Str::lower($email);
            if ($byEmail->has($key)) {
                continue;
            }
            $subscriber = NewsletterSubscriber::query()->where('email', $email)->first();
            $byEmail->put($key, [
                'email' => $email,
                'subscriber_id' => $subscriber?->id,
            ]);
        }

        return $byEmail->values();
    }
}
