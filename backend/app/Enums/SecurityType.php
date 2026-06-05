<?php

namespace App\Enums;

enum SecurityType: string
{
    case Stock = 'stock';
    case Bond = 'bond';
    case Etf = 'etf';
    case Index = 'index';

    public function label(): string
    {
        return match ($this) {
            self::Stock => 'Cổ phiếu',
            self::Bond => 'Trái phiếu',
            self::Etf => 'ETF',
            self::Index => 'Chỉ số',
        };
    }
}
