<?php

namespace App\Enums;

enum GalleryType: string
{
    case Photography = 'photography';
    case Painting = 'painting';

    public function label(): string
    {
        return match ($this) {
            self::Photography => 'Photography',
            self::Painting => 'Painting',
        };
    }
}
