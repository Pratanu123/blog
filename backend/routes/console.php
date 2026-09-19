<?php

use App\Jobs\GenerateSitemap;
use Illuminate\Support\Facades\Schedule;

Schedule::command('articles:publish-scheduled')->everyMinute();
Schedule::job(new GenerateSitemap)->hourly();
