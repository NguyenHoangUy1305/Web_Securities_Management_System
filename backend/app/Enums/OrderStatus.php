<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Open = 'open';
    case Filled = 'filled';
    case Partial = 'partial';
    case Cancelled = 'cancelled';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Chờ xử lý',
            self::Open => 'Đang mở',
            self::Filled => 'Đã khớp',
            self::Partial => 'Khớp một phần',
            self::Cancelled => 'Đã hủy',
            self::Rejected => 'Bị từ chối',
        };
    }
}
