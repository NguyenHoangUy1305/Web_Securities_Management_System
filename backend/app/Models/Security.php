<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SecurityType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Security extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'symbol',
        'name',
        'exchange',
        'type',
        'sector',
        'industry',
        'market_cap',
        'current_price',
        'eps',
        'pe_ratio',
        'dividend_yield',
        'volume',
        'day_high',
        'day_low',
        'year_high',
        'year_low',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'market_cap'     => 'decimal:2',
            'current_price'  => 'decimal:2',
            'eps'            => 'decimal:2',
            'pe_ratio'       => 'decimal:2',
            'dividend_yield' => 'decimal:2',
            'day_high'       => 'decimal:2',
            'day_low'        => 'decimal:2',
            'year_high'      => 'decimal:2',
            'year_low'       => 'decimal:2',
            'is_active'      => 'boolean',
        ];
    }

    /**
     * Get the market data records for this security.
     */
    public function marketData(): HasMany
    {
        return $this->hasMany(MarketData::class);
    }

    /**
     * Get the technical indicators for this security.
     */
    public function technicalIndicators(): HasMany
    {
        return $this->hasMany(TechnicalIndicator::class);
    }

    /**
     * Get the portfolio items for this security.
     */
    public function portfolioItems(): HasMany
    {
        return $this->hasMany(PortfolioItem::class);
    }

    /**
     * Get the watchlist items for this security.
     */
    public function watchlistItems(): HasMany
    {
        return $this->hasMany(WatchlistItem::class);
    }

    /**
     * Get the orders for this security.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the transactions for this security.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the news articles for this security.
     */
    public function newsArticles(): HasMany
    {
        return $this->hasMany(NewsArticle::class);
    }

    /**
     * Get the dividends for this security.
     */
    public function dividends(): HasMany
    {
        return $this->hasMany(Dividend::class);
    }

    // ── Scopes ──────────────────────────────────────────────────────────

    /**
     * Scope a query to only include active securities.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include securities of a given type.
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include securities in a given sector.
     */
    public function scopeBySector(Builder $query, string $sector): Builder
    {
        return $query->where('sector', $sector);
    }
}
