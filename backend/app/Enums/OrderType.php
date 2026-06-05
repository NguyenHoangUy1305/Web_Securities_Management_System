<?php

namespace App\Enums;

enum OrderType: string
{
    case Market = 'market';
    case Limit = 'limit';
    case Stop = 'stop';

    public function label(): string
    {
        return match ($this) {
            self::Market => 'Thị trường',
            self::Limit => 'Giới hạn',
            self::Stop => 'Dừng',
        };
    }
}
