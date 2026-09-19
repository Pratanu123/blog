<?php

namespace Tests\Unit;

use App\Support\HtmlSanitizer;
use PHPUnit\Framework\TestCase;

class HtmlSanitizerTest extends TestCase
{
    public function test_it_strips_scripts_and_keeps_editorial_markup(): void
    {
        $html = '<h2>Title</h2><p>Hello <script>alert(1)</script><strong>world</strong></p>';
        $clean = (new HtmlSanitizer)->sanitize($html);

        $this->assertStringContainsString('<h2>Title</h2>', $clean);
        $this->assertStringContainsString('<strong>world</strong>', $clean);
        $this->assertStringNotContainsString('<script>', $clean);
    }

    public function test_it_rejects_non_video_iframes(): void
    {
        $html = '<iframe src="https://evil.example/embed"></iframe><iframe src="https://www.youtube.com/embed/abc"></iframe>';
        $clean = (new HtmlSanitizer)->sanitize($html);

        $this->assertStringNotContainsString('evil.example', $clean);
        $this->assertStringContainsString('youtube.com', $clean);
    }
}
