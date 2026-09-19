<?php

namespace Database\Factories;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    public function definition(): array
    {
        $filename = fake()->uuid().'.jpg';

        return [
            'filename' => $filename,
            'original_filename' => fake()->word().'.jpg',
            'mime_type' => 'image/jpeg',
            'size' => fake()->numberBetween(20_000, 400_000),
            'path' => 'media/'.$filename,
            'alt_text' => fake()->sentence(4),
            'uploaded_by' => User::factory(),
        ];
    }
}
