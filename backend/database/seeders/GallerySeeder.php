<?php

namespace Database\Seeders;

use App\Enums\GalleryType;
use App\Models\GalleryWork;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class GallerySeeder extends Seeder
{
    public function run(): void
    {
        $uploader = User::query()->where('email', 'joyeeta@blogcms.test')->first()
            ?? User::query()->first();

        $path = 'gallery/painting/sample-evening-studio.svg';
        Storage::disk('public')->put($path, $this->samplePaintingSvg());

        GalleryWork::query()->updateOrCreate(
            ['slug' => 'evening-studio-wash'],
            [
                'type' => GalleryType::Painting->value,
                'title' => 'Evening Studio Wash',
                'short_description' => 'A quiet study in mint, rose, and lamp-warm edges — color held still long enough to look twice.',
                'description' => 'Sample painting for the gallery. Soft washes of teal and rose against a dark paper ground, made to show how a work card sits on this page.',
                'alt_text' => 'Abstract painting with mint green and rose washes over a dark ink ground',
                'filename' => 'sample-evening-studio.svg',
                'original_filename' => 'evening-studio-wash.svg',
                'mime_type' => 'image/svg+xml',
                'size' => Storage::disk('public')->size($path),
                'path' => $path,
                'is_published' => true,
                'sort_order' => 1,
                'uploaded_by' => $uploader?->id,
            ]
        );
    }

    private function samplePaintingSvg(): string
    {
        return <<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1200" role="img" aria-label="Evening Studio Wash">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1410"/>
      <stop offset="55%" stop-color="#241f1a"/>
      <stop offset="100%" stop-color="#16382e"/>
    </linearGradient>
    <radialGradient id="mint" cx="32%" cy="38%" r="48%">
      <stop offset="0%" stop-color="#e8fff4" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="#7ec9b0" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#3a8a72" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="rose" cx="72%" cy="62%" r="42%">
      <stop offset="0%" stop-color="#fff0f2" stop-opacity="0.85"/>
      <stop offset="40%" stop-color="#e8a0b0" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#b05a6a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lamp" cx="58%" cy="22%" r="30%">
      <stop offset="0%" stop-color="#fff4d4" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#f0c878" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#c45c26" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="960" height="1200" fill="url(#ground)"/>
  <ellipse cx="300" cy="420" rx="340" ry="280" fill="url(#mint)"/>
  <ellipse cx="680" cy="760" rx="320" ry="300" fill="url(#rose)"/>
  <ellipse cx="560" cy="260" rx="220" ry="180" fill="url(#lamp)"/>
  <path d="M120 980 C260 860, 420 900, 520 820 C640 720, 760 740, 880 640" fill="none" stroke="#7ec9b0" stroke-width="18" stroke-linecap="round" opacity="0.45"/>
  <path d="M80 300 C220 360, 280 520, 360 640 C430 740, 520 820, 640 900" fill="none" stroke="#e8a0b0" stroke-width="14" stroke-linecap="round" opacity="0.4"/>
  <circle cx="540" cy="510" r="46" fill="#fbf7f0" opacity="0.55"/>
  <circle cx="540" cy="510" r="22" fill="#c45c26" opacity="0.7"/>
</svg>
SVG;
    }
}
