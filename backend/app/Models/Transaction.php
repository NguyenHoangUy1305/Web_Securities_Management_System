<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'portfolio_id',
        'security_id',
        'order_id',
        'type',
        'quantity',
        'price',
        'total_amount',
        'fee',
        'tax',
        'net_amount',
        'executed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'type'         => TransactionType::class,
            'quantity'     => 'decimal:4',
            'price'        => 'decimal:2',
            'total_amount' => 'decimal:2',
            'fee'          => 'decimal:2',
            'tax'          => 'decimal:2',
            'net_amount'   => 'decimal:2',
            'executed_at'  => 'datetime',
        ];
    }

    /**
     * Get the user that owns this transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the portfolio that owns this transaction.
     */
    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }

    /**
     * Get the security associated with this transaction.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class);
    }

    /**
     * Get the order associated with this transaction.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
