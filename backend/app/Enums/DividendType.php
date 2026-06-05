<?php

namespace App\Enums;

enum DividendType: string
{
    case Cash = 'cash';
    case Stock = 'stock';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Tiền mặt',
            self::Stock => 'Cổ phiếu',
        };
    }
}
