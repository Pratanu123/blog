<?php

namespace Database\Seeders;

use App\Enums\ArticleStatus;
use App\Models\Article;
use App\Models\ArticleView;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->where('email', 'joyeeta@blogcms.test')->first()
            ?? User::query()->first();

        $item = [
            'title' => 'Writing in Public Without Performing',
            'slug' => 'writing-in-public-without-performing',
            'category' => 'culture',
            'tags' => ['Writing', 'Culture', 'Product'],
            'views' => 512,
            'days' => 3,
            'excerpt' => 'A magazine can be a studio. It does not have to be a stage.',
        ];

        $category = Category::query()->where('slug', $item['category'])->first();

        $article = Article::query()->updateOrCreate(
            ['slug' => $item['slug']],
            [
                'title' => $item['title'],
                'excerpt' => $item['excerpt'],
                'content' => $this->body($item['title'], $item['excerpt']),
                'author_id' => $author->id,
                'author_name' => $author?->name,
                'category_id' => $category?->id,
                'status' => ArticleStatus::Published->value,
                'published_at' => now()->subDays($item['days']),
                'scheduled_at' => null,
                'meta_title' => $item['title'],
                'meta_description' => $item['excerpt'],
                'og_title' => $item['title'],
                'og_description' => $item['excerpt'],
                'twitter_card' => 'summary_large_image',
                'reading_time' => 6,
                'views' => $item['views'],
            ]
        );

        $tagIds = Tag::query()->whereIn('name', $item['tags'])->pluck('id');
        $article->tags()->sync($tagIds);

        for ($i = 0; $i < 8; $i++) {
            ArticleView::query()->updateOrCreate(
                ['article_id' => $article->id, 'viewed_on' => now()->subDays($i)->toDateString()],
                ['views' => max(4, (int) (($item['views'] / 10) - $i * 6))]
            );
        }

        Article::withTrashed()
            ->where('slug', '!=', $item['slug'])
            ->each(function (Article $extra) {
                $extra->tags()->detach();
                $extra->dailyViews()->delete();
                $extra->revisions()->delete();
                $extra->forceDelete();
            });
    }

    private function body(string $title, string $excerpt): string
    {
        return <<<HTML
<p>{$excerpt}</p>
<h2>Start with the constraint</h2>
<p>Most writing about software begins with tools. The more useful starting point is the constraint: a reader, a deadline, a database that must survive a restart, a homepage that has to feel like a magazine instead of a dashboard.</p>
<p>When the constraint is clear, the stack becomes a set of boring, good decisions. PHP 8.3 and Laravel for the editorial API. MySQL for the source of truth. Redis for the pages people hit twice. React for the surfaces that need to move.</p>
<blockquote><p>Architecture is the art of delaying irreversible choices without pretending they will never arrive.</p></blockquote>
<h2>What we keep on the request</h2>
<ul>
<li>Authentication and authorization</li>
<li>Validation</li>
<li>A thin controller that names the action</li>
</ul>
<h2>What we move off the request</h2>
<ol>
<li>Image processing</li>
<li>Sitemap regeneration</li>
<li>Cache invalidation</li>
<li>Newsletter delivery</li>
</ol>
<pre><code>Cache::remember('cms.homepage', 300, fn () => \$this->buildHomepage());</code></pre>
<p>The title <em>{$title}</em> is less a destination than a reminder: ship the smallest complete system, then earn the next layer.</p>
<table>
<thead><tr><th>Layer</th><th>Job</th></tr></thead>
<tbody>
<tr><td>Nginx</td><td>Edge routing, static files, upload limits</td></tr>
<tr><td>Laravel</td><td>Rules, persistence, jobs</td></tr>
<tr><td>React</td><td>Reading and editing</td></tr>
</tbody>
</table>
<hr>
<p>If a later version needs OpenSearch or object storage, the seams are already there. The first version should still be one command: <strong>docker compose up -d</strong>.</p>
HTML;
    }
}
