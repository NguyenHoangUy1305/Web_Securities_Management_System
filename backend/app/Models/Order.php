<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderSide;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'portfolio_id',
        'security_id',
        'type',
        'order_type',
        'quantity',
        'price',
        'total_amount',
        'status',
        'filled_quantity',
        'filled_price',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'type'            => OrderSide::class,
            'order_type'      => OrderType::class,
            'status'          => OrderStatus::class,
            'quantity'        => 'decimal:4',
            'price'           => 'decimal:2',
            'total_amount'    => 'decimal:2',
            'filled_quantity' => 'decimal:4',
            'filled_price'    => 'decimal:2',
            'expires_at'      => 'datetime',
        ];
    }

    /**
     * Get the user that owns this order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the portfolio that owns this order.
     */
    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }

    /**
     * Get the security associated with this order.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class);
    }

    // ── Scopes ──────────────────────────────────────────────────────────

    /**
     * Scope a query to only include pending orders.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', OrderStatus::Pending);
    }

    /**
     * Scope a query to only include filled orders.
     */
    public function scopeFilled(Builder $query): Builder
    {
        return $query->where('status', OrderStatus::Filled);
    }

    /**
     * Scope a query to only include cancelled orders.
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', OrderStatus::Cancelled);
    }

    /**
     * Scope a query to only include orders belonging to a specific user.
     */
    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
