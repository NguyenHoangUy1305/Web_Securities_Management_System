<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioItem extends Model
{
    /**
     * The portfolio_items table has no timestamps columns.
     */
    public $timestamps = false;

    protected $fillable = [
        'portfolio_id',
        'security_id',
        'quantity',
        'avg_buy_price',
    ];

    /**
     * Computed attributes appended to JSON output.
     * These values are calculated dynamically and override any stored DB values.
     */
    protected $appends = [
        'current_value',
        'profit_loss',
        'profit_loss_percent',
    ];

    protected function casts(): array
    {
        return [
            'quantity'      => 'decimal:4',
            'avg_buy_price' => 'decimal:4',
        ];
    }

    /**
     * Get the portfolio that owns this item.
     */
    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }

    /**
     * Get the security associated with this item.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class);
    }

    // ── Dynamic accessors ──────────────────────────────────────────────

    /**
     * Calculate the current market value of this holding.
     *
     * current_value = quantity * security.current_price
     */
    public function getCurrentValueAttribute(): ?float
    {
        if ($this->relationLoaded('security') && $this->security !== null && $this->security->current_price !== null) {
            return round(
                (float) $this->quantity * (float) $this->security->current_price,
                2
            );
        }

        return null;
    }

    /**
     * Calculate the unrealised profit / loss in currency.
     *
     * profit_loss = (security.current_price - avg_buy_price) * quantity
     */
    public function getProfitLossAttribute(): ?float
    {
        if ($this->relationLoaded('security') && $this->security !== null && $this->security->current_price !== null) {
            return round(
                ((float) $this->security->current_price - (float) $this->avg_buy_price) * (float) $this->quantity,
                2
            );
        }

        return null;
    }

    /**
     * Calculate the unrealised profit / loss as a percentage of cost basis.
     *
     * profit_loss_percent = ((current_price - avg_buy_price) / avg_buy_price) * 100
     */
    public function getProfitLossPercentAttribute(): ?float
    {
        $avgBuyPrice = (float) $this->avg_buy_price;

        if ($avgBuyPrice <= 0) {
            return null;
        }

        if ($this->relationLoaded('security') && $this->security !== null && $this->security->current_price !== null) {
            $currentPrice = (float) $this->security->current_price;

            return round(
                (($currentPrice - $avgBuyPrice) / $avgBuyPrice) * 100,
                2
            );
        }

        return null;
    }
}
