<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioDividend extends Model
{
    protected $fillable = [
        'portfolio_id',
        'dividend_id',
        'security_id',
        'shares_owned',
        'total_amount',
        'received_date',
    ];

    protected function casts(): array
    {
        return [
            'shares_owned'  => 'decimal:4',
            'total_amount'  => 'decimal:2',
            'received_date' => 'date:Y-m-d',
        ];
    }

    /**
     * Get the portfolio that received this dividend.
     */
    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }

    /**
     * Get the dividend record associated with this payment.
     */
    public function dividend(): BelongsTo
    {
        return $this->belongsTo(Dividend::class);
    }

    /**
     * Get the security that this dividend payment is for.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class);
    }
}
