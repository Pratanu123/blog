<?php

namespace App\Console\Commands;

use App\Services\EmailCampaignService;
use Illuminate\Console\Command;

class SendScheduledCampaigns extends Command
{
    protected $signature = 'campaigns:send-scheduled';

    protected $description = 'Send email campaigns whose scheduled time has arrived';

    public function handle(EmailCampaignService $campaigns): int
    {
        $count = $campaigns->sendDueScheduled();
        $this->info("Sent {$count} scheduled campaign(s).");

        return self::SUCCESS;
    }
}
