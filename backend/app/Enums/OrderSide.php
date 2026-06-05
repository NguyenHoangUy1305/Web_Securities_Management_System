<?php

namespace App\Enums;

enum OrderSide: string
{
    case Buy = 'buy';
    case Sell = 'sell';

    public function label(): string
    {
        return match ($this) {
            self::Buy => 'Mua',
            self::Sell => 'Bán',
        };
    }
}
