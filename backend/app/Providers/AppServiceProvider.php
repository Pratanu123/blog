<?php

namespace App\Providers;

use App\Models\Article;
use App\Models\Category;
use App\Models\ContactMessage;
use App\Models\ContentComment;
use App\Models\EmailCampaign;
use App\Models\GalleryWork;
use App\Models\Media;
use App\Models\Setting;
use App\Models\Tag;
use App\Models\User;
use App\Policies\ArticlePolicy;
use App\Policies\CategoryPolicy;
use App\Policies\ContactMessagePolicy;
use App\Policies\ContentCommentPolicy;
use App\Policies\EmailCampaignPolicy;
use App\Policies\GalleryWorkPolicy;
use App\Policies\MediaPolicy;
use App\Policies\SettingPolicy;
use App\Policies\TagPolicy;
use App\Policies\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();

        Gate::policy(Article::class, ArticlePolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Tag::class, TagPolicy::class);
        Gate::policy(Media::class, MediaPolicy::class);
        Gate::policy(GalleryWork::class, GalleryWorkPolicy::class);
        Gate::policy(ContentComment::class, ContentCommentPolicy::class);
        Gate::policy(ContactMessage::class, ContactMessagePolicy::class);
        Gate::policy(EmailCampaign::class, EmailCampaignPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Setting::class, SettingPolicy::class);

        RateLimiter::for('login', function ($request) {
            return Limit::perMinute(10)->by($request->ip());
        });
    }
}
