<?php

namespace App\Http\Controllers;

use App\Services\SeoService;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    public function __construct(private readonly SeoService $seo) {}

    public function sitemap(): Response
    {
        return response($this->seo->sitemapXml(), 200)->header('Content-Type', 'application/xml');
    }

    public function robots(): Response
    {
        return response($this->seo->robotsTxt(), 200)->header('Content-Type', 'text/plain');
    }

    public function feed(): Response
    {
        return response($this->seo->rssXml(), 200)->header('Content-Type', 'application/rss+xml');
    }
}
