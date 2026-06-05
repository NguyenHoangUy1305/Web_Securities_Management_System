<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Watchlist;

class WatchlistRepository extends BaseRepository
{
    public function __construct(Watchlist $watchlist)
    {
        parent::__construct($watchlist);
    }
}
