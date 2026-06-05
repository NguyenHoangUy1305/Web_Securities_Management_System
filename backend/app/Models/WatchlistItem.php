<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WatchlistItem extends Model
{
    protected $fillable = [
        'watchlist_id',
        'security_id',
        'alert_price_above',
        'alert_price_below',
        'alert_enabled',
    ];

    protected function casts(): array
    {
        return [
            'alert_price_above' => 'decimal:2',
            'alert_price_below' => 'decimal:2',
            'alert_enabled'     => 'boolean',
        ];
    }

    /**
     * Get the watchlist that owns this item.
     */
    public function watchlist(): BelongsTo
    {
        return $this->belongsTo(Watchlist::class);
    }

    /**
     * Get the security associated with this item.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class);
    }

    // ── Scopes ──────────────────────────────────────────────────────────

    /**
     * Scope a query to only include items with alerts enabled.
     */
    public function scopeWithAlertsEnabled(Builder $query): Builder
    {
        return $query->where('alert_enabled', true);
    }
}
