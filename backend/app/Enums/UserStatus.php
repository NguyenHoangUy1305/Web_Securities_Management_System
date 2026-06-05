<?php

namespace App\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Hoạt động',
            self::Inactive => 'Không hoạt động',
            self::Suspended => 'Bị khóa',
        };
    }
}
