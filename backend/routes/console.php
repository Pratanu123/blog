<?php

use App\Jobs\GenerateSitemap;
use Illuminate\Support\Facades\Schedule;

Schedule::command('articles:publish-scheduled')->everyMinute();
Schedule::command('campaigns:send-scheduled')->everyMinute();
Schedule::job(new GenerateSitemap)->hourly();
