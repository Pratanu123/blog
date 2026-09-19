<?php

namespace App\Support;

class HtmlSanitizer
{
    public function sanitize(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        $allowed = '<p><br><h1><h2><h3><h4><h5><h6><strong><em><b><i><u><s><a><ul><ol><li><blockquote><pre><code><img><table><thead><tbody><tr><th><td><hr><iframe><span><div><figure><figcaption><sup><sub>';
        $clean = strip_tags($html, $allowed);

        return preg_replace_callback('/<iframe\b[^>]*>.*?<\/iframe>/is', function (array $matches) {
            if (! preg_match('/src=["\']([^"\']+)["\']/', $matches[0], $src)) {
                return '';
            }

            $url = $src[1];
            if (! preg_match('#^https://(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)/#i', $url)) {
                return '';
            }

            return $matches[0];
        }, $clean);
    }
}
