<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Tag;
use Illuminate\Database\Seeder;

class TaxonomySeeder extends Seeder
{
    public function run(): void
    {
        $tree = [
            'Technology' => [
                'description' => 'Infrastructure, tools, and the systems underneath modern software.',
                'children' => [
                    'Programming' => [
                        'description' => 'Languages, craft, and production trade-offs.',
                        'children' => [
                            'PHP' => 'Practical notes from shipping Laravel systems.',
                            'Go' => 'Concurrency, simplicity, and production services.',
                        ],
                    ],
                    'AI' => 'Models, product judgment, and the human layer.',
                ],
            ],
            'Design' => [
                'description' => 'Type, layout, and the quiet work of making reading feel inevitable.',
            ],
            'Culture' => [
                'description' => 'Cities, work, and the stories we tell about building things.',
            ],
        ];

        $this->seedTree($tree);

        $tags = [
            'Laravel', 'PHP', 'Go', 'Docker', 'Redis', 'MySQL', 'Typography',
            'Product', 'Systems', 'Writing', 'Frontend', 'Security',
        ];

        foreach ($tags as $name) {
            Tag::query()->updateOrCreate(
                ['slug' => str($name)->slug()],
                ['name' => $name]
            );
        }
    }

    private function seedTree(array $tree, ?int $parentId = null): void
    {
        foreach ($tree as $name => $value) {
            if (is_string($value)) {
                Category::query()->updateOrCreate(
                    ['slug' => str($name)->slug()],
                    ['name' => $name, 'description' => $value, 'parent_id' => $parentId]
                );

                continue;
            }

            $category = Category::query()->updateOrCreate(
                ['slug' => str($name)->slug()],
                [
                    'name' => $name,
                    'description' => $value['description'] ?? null,
                    'parent_id' => $parentId,
                ]
            );

            if (! empty($value['children'])) {
                $this->seedTree($value['children'], $category->id);
            }
        }
    }
}
