<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketData extends Model
{
    protected $fillable = [
        'security_id',
        'timestamp',
        'open',
        'high',
        'low',
        'close',
        'volume',
    ];

    protected function casts(): array
    {
        return [
            'timestamp' => 'datetime',
            'open'      => 'decimal:4',
            'high'      => 'decimal:4',
            'low'       => 'decimal:4',
            'close'     => 'decimal:4',
            'volume'    => 'integer',
        ];
    }

    /**
     * Get the security that owns this market data record.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class);
    }

    /**
     * Get the technical indicators for this market data record.
     */
    public function technicalIndicators(): HasMany
    {
        return $this->hasMany(TechnicalIndicator::class);
    }
}
