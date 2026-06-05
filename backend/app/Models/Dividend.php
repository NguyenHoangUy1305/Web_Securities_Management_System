<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dividend extends Model
{
    protected $fillable = [
        'security_id',
        'ex_date',
        'payment_date',
        'record_date',
        'amount_per_share',
        'currency',
        'dividend_type',
    ];

    protected function casts(): array
    {
        return [
            'ex_date'         => 'date:Y-m-d',
            'payment_date'    => 'date:Y-m-d',
            'record_date'     => 'date:Y-m-d',
            'amount_per_share' => 'decimal:4',
        ];
    }

    /**
     * Get the security that this dividend belongs to.
     */
    public function security(): BelongsTo
    {
        return $this->belongsTo(Security::class);
    }

    /**
     * Get the portfolio dividend records for this dividend.
     */
    public function portfolioDividends(): HasMany
    {
        return $this->hasMany(PortfolioDividend::class);
    }
}
