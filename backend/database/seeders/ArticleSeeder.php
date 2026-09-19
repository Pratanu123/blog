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
        $authors = User::query()->whereIn('email', [
            'leo@blogcms.test',
            'maya@blogcms.test',
            'sofia@blogcms.test',
            'editor@blogcms.test',
        ])->get()->keyBy('email');

        $articles = [
            [
                'title' => 'How to Learn Go Without Collecting Tutorials',
                'slug' => 'how-to-learn-golang',
                'category' => 'go',
                'author' => 'leo@blogcms.test',
                'tags' => ['Go', 'Programming', 'Systems'],
                'views' => 1840,
                'days' => 18,
                'excerpt' => 'A working path through Go: small programs, real constraints, and the standard library before the framework tour.',
            ],
            [
                'title' => 'A System Design Guide for People Who Ship',
                'slug' => 'system-design-guide',
                'category' => 'technology',
                'author' => 'leo@blogcms.test',
                'tags' => ['Systems', 'Redis', 'MySQL'],
                'views' => 2310,
                'days' => 14,
                'excerpt' => 'System design is not a whiteboard sport. It is a sequence of boring, reversible decisions under load.',
            ],
            [
                'title' => 'Laravel Queues, Redis, and the Art of Later',
                'slug' => 'laravel-queues-redis',
                'category' => 'php',
                'author' => 'leo@blogcms.test',
                'tags' => ['Laravel', 'Redis', 'PHP'],
                'views' => 1566,
                'days' => 11,
                'excerpt' => 'Move the slow work off the request. Then make sure you can see it fail.',
            ],
            [
                'title' => 'Why Editorial Type Still Wins on the Web',
                'slug' => 'editorial-type-still-wins',
                'category' => 'design',
                'author' => 'maya@blogcms.test',
                'tags' => ['Typography', 'Writing', 'Frontend'],
                'views' => 980,
                'days' => 9,
                'excerpt' => 'A homepage is a typesetting problem first. The rest of the interface is there to protect the reading.',
            ],
            [
                'title' => 'Designing a CMS That Does Not Feel Like Software',
                'slug' => 'cms-that-does-not-feel-like-software',
                'category' => 'design',
                'author' => 'maya@blogcms.test',
                'tags' => ['Product', 'Frontend', 'Writing'],
                'views' => 1212,
                'days' => 7,
                'excerpt' => 'Editors do not want a dashboard. They want a quiet room with the right levers in reach.',
            ],
            [
                'title' => 'MySQL Full-Text Search Is Enough Until It Is Not',
                'slug' => 'mysql-full-text-search',
                'category' => 'technology',
                'author' => 'leo@blogcms.test',
                'tags' => ['MySQL', 'Laravel', 'Systems'],
                'views' => 744,
                'days' => 6,
                'excerpt' => 'Start with MATCH AGAINST. Keep the door open for OpenSearch. Do not introduce a cluster on day one.',
            ],
            [
                'title' => 'Docker Compose for a Newsroom, Not a Demo',
                'slug' => 'docker-compose-newsroom',
                'category' => 'technology',
                'author' => 'editor@blogcms.test',
                'tags' => ['Docker', 'Laravel', 'Redis'],
                'views' => 690,
                'days' => 5,
                'excerpt' => 'A local stack should feel like production: Nginx, PHP-FPM, MySQL, Redis, and a frontend that hot-reloads.',
            ],
            [
                'title' => 'The Quiet Security Checklist for File Uploads',
                'slug' => 'security-checklist-file-uploads',
                'category' => 'technology',
                'author' => 'editor@blogcms.test',
                'tags' => ['Security', 'PHP', 'Laravel'],
                'views' => 1104,
                'days' => 4,
                'excerpt' => 'MIME type, extension, size, and storage path. Four decisions that prevent most media disasters.',
            ],
            [
                'title' => 'Writing in Public Without Performing',
                'slug' => 'writing-in-public-without-performing',
                'category' => 'culture',
                'author' => 'maya@blogcms.test',
                'tags' => ['Writing', 'Culture', 'Product'],
                'views' => 512,
                'days' => 3,
                'excerpt' => 'A magazine can be a studio. It does not have to be a stage.',
            ],
            [
                'title' => 'Scheduled Publishing Is a Product Feature',
                'slug' => 'scheduled-publishing-product-feature',
                'category' => 'php',
                'author' => 'leo@blogcms.test',
                'tags' => ['Laravel', 'Product', 'Systems'],
                'views' => 430,
                'days' => 2,
                'excerpt' => 'A scheduler, a queue, and a status field. The rest is trust.',
            ],
            [
                'title' => 'Dark Mode That Respects Paper and Ink',
                'slug' => 'dark-mode-paper-and-ink',
                'category' => 'design',
                'author' => 'maya@blogcms.test',
                'tags' => ['Frontend', 'Typography', 'Product'],
                'status' => 'draft',
                'excerpt' => 'Dim the room. Do not invert the magazine.',
            ],
            [
                'title' => 'Notes on a PHP Service Layer That Stays Small',
                'slug' => 'php-service-layer-stays-small',
                'category' => 'php',
                'author' => 'leo@blogcms.test',
                'tags' => ['PHP', 'Laravel', 'Systems'],
                'status' => 'scheduled',
                'excerpt' => 'Controllers stay thin. Services stay specific. Repositories wait until they earn their keep.',
            ],
        ];

        foreach ($articles as $item) {
            $category = Category::query()->where('slug', $item['category'])->first();
            $author = $authors[$item['author']] ?? User::query()->first();
            $status = $item['status'] ?? ArticleStatus::Published->value;

            $article = Article::query()->updateOrCreate(
                ['slug' => $item['slug']],
                [
                    'title' => $item['title'],
                    'excerpt' => $item['excerpt'],
                    'content' => $this->body($item['title'], $item['excerpt']),
                    'author_id' => $author->id,
                    'category_id' => $category?->id,
                    'status' => $status,
                    'published_at' => $status === ArticleStatus::Published->value ? now()->subDays($item['days'] ?? 1) : null,
                    'scheduled_at' => $status === ArticleStatus::Scheduled->value ? now()->addDay() : null,
                    'meta_title' => $item['title'],
                    'meta_description' => $item['excerpt'],
                    'og_title' => $item['title'],
                    'og_description' => $item['excerpt'],
                    'twitter_card' => 'summary_large_image',
                    'reading_time' => 6,
                    'views' => $item['views'] ?? 0,
                ]
            );

            $tagIds = Tag::query()->whereIn('name', $item['tags'])->pluck('id');
            $article->tags()->sync($tagIds);

            if (($item['views'] ?? 0) > 0) {
                for ($i = 0; $i < 8; $i++) {
                    ArticleView::query()->updateOrCreate(
                        ['article_id' => $article->id, 'viewed_on' => now()->subDays($i)->toDateString()],
                        ['views' => max(4, (int) (($item['views'] / 10) - $i * 6))]
                    );
                }
            }
        }
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
