<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TechnicalIndicator extends Model
{
    protected $fillable = [
        'market_data_id',
        'security_id',
        'timestamp',
        'rsi_14',
        'macd_line',
        'macd_signal',
        'macd_histogram',
        'sma_20',
        'sma_50',
        'sma_200',
        'ema_12',
        'ema_26',
    ];

    protected function casts(): array
    {
        return [
            'timestamp'      => 'datetime',
            'rsi_14'         => 'decimal:4',
            'macd_line'      => 'decimal:4',
            'macd_signal'    => 'decimal:4',
            'macd_histogram' => 'decimal:4',
            'sma_20'         => 'decimal:4',
            'sma_50'         => 'decimal:4',
            'sma_200'        => 'decimal:4',
            'ema_12'         => 'decimal:4',
            'ema_26'         => 'decimal:4',
        ];
    }

    /**
     * Get the market data record that owns this technical indicator.
     */
    public function marketData(): BelongsTo
    {
        return $this->belongsTo(MarketData::class);
    }

    /**
     * Get the security that owns this technical indicator.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class);
    }
}
