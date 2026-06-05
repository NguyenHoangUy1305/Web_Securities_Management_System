<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Portfolio extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'total_value',
        'cash_balance',
    ];

    protected function casts(): array
    {
        return [
            'total_value'  => 'decimal:2',
            'cash_balance' => 'decimal:2',
        ];
    }

    /**
     * Get the user that owns this portfolio.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the items in this portfolio.
     */
    public function items(): HasMany
    {
        return $this->hasMany(PortfolioItem::class);
    }

    /**
     * Recalculate the total value based on current holdings and cash balance.
     */
    public function recalculateTotalValue(): void
    {
        $holdingsValue = $this->items()
            ->with('security')
            ->get()
            ->sum(function (PortfolioItem $item) {
                return $item->current_value ?? 0;
            });

        $this->total_value = $holdingsValue + (float) $this->cash_balance;
        $this->save();
    }
}
