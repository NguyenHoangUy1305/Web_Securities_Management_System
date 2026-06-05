<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Watchlist extends Model
{
    protected $fillable = [
        'user_id',
        'name',
    ];

    /**
     * Get the user that owns this watchlist.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the items in this watchlist.
     */
    public function items(): HasMany
    {
        return $this->hasMany(WatchlistItem::class);
    }
}
