<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class SeoService
{
    public function __construct(private readonly SettingsService $settings) {}

    public function sitemapXml(): string
    {
        return Cache::remember('cms.sitemap', 1800, fn () => $this->buildSitemap());
    }

    public function refreshSitemap(): string
    {
        Cache::forget('cms.sitemap');

        return $this->sitemapXml();
    }

    public function robotsTxt(): string
    {
        return Cache::remember('cms.robots', 3600, function () {
            $custom = trim((string) $this->settings->get('robots_custom', ''));
            $base = rtrim((string) $this->settings->get('site_url', config('app.url')), '/');

            $default = implode("\n", [
                'User-agent: *',
                'Allow: /',
                'Disallow: /admin',
                'Disallow: /api',
                "Sitemap: {$base}/sitemap.xml",
            ]);

            return trim($custom !== '' ? $custom : $default);
        });
    }

    public function rssXml(): string
    {
        return Cache::remember('cms.rss', 900, fn () => $this->buildRss());
    }

    private function buildSitemap(): string
    {
        $base = rtrim((string) $this->settings->get('site_url', config('app.url')), '/');
        $urls = [
            ['loc' => $base.'/', 'changefreq' => 'daily', 'priority' => '1.0'],
            ['loc' => $base.'/blog', 'changefreq' => 'daily', 'priority' => '0.9'],
            ['loc' => $base.'/about', 'changefreq' => 'monthly', 'priority' => '0.4'],
            ['loc' => $base.'/about-me', 'changefreq' => 'monthly', 'priority' => '0.4'],
            ['loc' => $base.'/contact', 'changefreq' => 'monthly', 'priority' => '0.3'],
        ];

        foreach (Article::query()->published()->latest('published_at')->get(['slug', 'updated_at']) as $article) {
            $urls[] = [
                'loc' => $base.'/blog/'.$article->slug,
                'lastmod' => $article->updated_at?->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ];
        }

        foreach (Category::query()->get(['slug', 'updated_at']) as $category) {
            $urls[] = [
                'loc' => $base.'/category/'.$category->slug,
                'lastmod' => $category->updated_at?->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.6',
            ];
        }

        foreach (Tag::query()->get(['slug', 'updated_at']) as $tag) {
            $urls[] = [
                'loc' => $base.'/tag/'.$tag->slug,
                'lastmod' => $tag->updated_at?->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.5',
            ];
        }

        foreach (User::query()->whereNotNull('slug')->get(['slug', 'updated_at']) as $author) {
            $urls[] = [
                'loc' => $base.'/author/'.$author->slug,
                'lastmod' => $author->updated_at?->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.4',
            ];
        }

        $items = '';
        foreach ($urls as $url) {
            $items .= '<url>';
            $items .= '<loc>'.e($url['loc']).'</loc>';
            if (! empty($url['lastmod'])) {
                $items .= '<lastmod>'.$url['lastmod'].'</lastmod>';
            }
            $items .= '<changefreq>'.$url['changefreq'].'</changefreq>';
            $items .= '<priority>'.$url['priority'].'</priority>';
            $items .= '</url>';
        }

        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'.$items.'</urlset>';
    }

    private function buildRss(): string
    {
        $siteName = e((string) $this->settings->get('site_name', config('app.name')));
        $siteUrl = rtrim((string) $this->settings->get('site_url', config('app.url')), '/');
        $description = e((string) $this->settings->get('site_description', 'A modern editorial blog.'));

        $items = '';
        $articles = Article::query()->with('author')->published()->latest('published_at')->limit(30)->get();

        foreach ($articles as $article) {
            $link = $siteUrl.'/blog/'.$article->slug;
            $items .= '<item>'
                .'<title>'.e($article->title).'</title>'
                .'<link>'.$link.'</link>'
                .'<guid>'.$link.'</guid>'
                .'<pubDate>'.($article->published_at?->toRfc2822String() ?? '').'</pubDate>'
                .'<description>'.e((string) $article->excerpt).'</description>'
                .'</item>';
        }

        return '<?xml version="1.0" encoding="UTF-8"?>'
            .'<rss version="2.0"><channel>'
            .'<title>'.$siteName.'</title>'
            .'<link>'.$siteUrl.'</link>'
            .'<description>'.$description.'</description>'
            .$items
            .'</channel></rss>';
    }
}
