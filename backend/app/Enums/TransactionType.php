<?php

namespace App\Enums;

enum TransactionType: string
{
    case Buy = 'buy';
    case Sell = 'sell';
    case Dividend = 'dividend';
    case Deposit = 'deposit';
    case Withdrawal = 'withdrawal';

    public function label(): string
    {
        return match ($this) {
            self::Buy => 'Mua',
            self::Sell => 'Bán',
            self::Dividend => 'Cổ tức',
            self::Deposit => 'Nạp tiền',
            self::Withdrawal => 'Rút tiền',
        };
    }
}
