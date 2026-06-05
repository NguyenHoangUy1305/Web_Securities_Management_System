<?php

namespace App\Enums;

enum SentimentType: string
{
    case Positive = 'positive';
    case Negative = 'negative';
    case Neutral = 'neutral';

    public function label(): string
    {
        return match ($this) {
            self::Positive => 'Tích cực',
            self::Negative => 'Tiêu cực',
            self::Neutral => 'Trung lập',
        };
    }
}
