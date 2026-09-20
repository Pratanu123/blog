<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'slug' => 'welcome',
                'name' => 'Welcome greeting',
                'subject' => 'Welcome to {{site_name}}',
                'description' => 'Sent automatically when someone subscribes.',
                'is_system' => true,
                'html_body' => <<<'HTML'
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0c0a;font-family:Georgia,serif;color:#f4e8d4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0c0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1410;border:1px solid #3a2a20;border-radius:16px;padding:32px;">
        <tr><td>
          {{logo_block}}
          <h1 style="margin:0 0 16px;font-size:28px;color:#fff6e8;">Welcome aboard</h1>
          <p style="margin:0 0 16px;line-height:1.6;color:#e8d9c4;">Thanks for subscribing with <strong>{{email}}</strong>. You will get occasional letters from the newsroom — no noise, unsubscribe whenever you like.</p>
          <p style="margin:24px 0 0;font-size:13px;color:#a89078;">— The {{site_name_html}} desk</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML,
            ],
            [
                'slug' => 'campaign-letter',
                'name' => 'Campaign letter',
                'subject' => 'A note from {{site_name}}',
                'description' => 'General campaign template for selected subscribers.',
                'is_system' => false,
                'html_body' => <<<'HTML'
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0c0a;font-family:Georgia,serif;color:#f4e8d4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0c0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1410;border:1px solid #3a2a20;border-radius:16px;padding:32px;">
        <tr><td>
          {{logo_block}}
          <h1 style="margin:0 0 16px;font-size:26px;color:#fff6e8;">Hello from the desk</h1>
          <p style="margin:0 0 16px;line-height:1.6;color:#e8d9c4;">Hi {{email}},</p>
          <p style="margin:0 0 16px;line-height:1.6;color:#e8d9c4;">Edit this template in Email Campaigns to craft your letter. Each subscriber receives their own individual message.</p>
          <p style="margin:24px 0 0;font-size:13px;color:#a89078;">© {{year}} {{site_name_html}}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML,
            ],
            [
                'slug' => 'announcement',
                'name' => 'Announcement',
                'subject' => 'News from {{site_name}}',
                'description' => 'Short announcement blast.',
                'is_system' => false,
                'html_body' => <<<'HTML'
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#111;font-family:Georgia,serif;color:#f5efe6;">
  <div style="max-width:560px;margin:32px auto;padding:28px;background:#1c1612;border-radius:14px;border:1px solid #3d2e24;">
    {{logo_block}}
    <h1 style="margin:0 0 12px;font-size:24px;color:#fff8ec;">Announcement</h1>
    <p style="line-height:1.65;color:#e6d8c4;">Something new is live at {{site_name_html}}. Open the site when you have a quiet minute.</p>
    <p style="margin-top:20px;font-size:13px;color:#a89078;">Sent to {{email}}</p>
  </div>
</body>
</html>
HTML,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::query()->updateOrCreate(
                ['slug' => $template['slug']],
                $template
            );
        }
    }
}
