<?php

namespace App\Jobs;

use App\Models\Article;
use App\Models\NewsletterSubscriber;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendNewsletter implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $articleId) {}

    public function handle(): void
    {
        $article = Article::query()->with('author')->find($this->articleId);
        if (! $article) {
            return;
        }

        $subscribers = NewsletterSubscriber::query()->where('status', 'active')->pluck('email');

        foreach ($subscribers as $email) {
            Mail::raw(
                "A new article was published: {$article->title}\n".url('/blog/'.$article->slug),
                function ($message) use ($email, $article) {
                    $message->to($email)->subject('New article: '.$article->title);
                }
            );
        }

        Log::info('Newsletter dispatch completed', [
            'article_id' => $article->id,
            'recipients' => $subscribers->count(),
        ]);
    }
}
