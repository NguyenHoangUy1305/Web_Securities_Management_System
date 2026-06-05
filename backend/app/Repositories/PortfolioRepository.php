<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Portfolio;
use Illuminate\Database\Eloquent\Collection;

class PortfolioRepository extends BaseRepository
{
    public function __construct(Portfolio $portfolio)
    {
        parent::__construct($portfolio);
    }

    /**
     * Retrieve all portfolios belonging to a specific user.
     *
     * @return Collection<int, Portfolio>
     */
    public function getByUser(int $userId): Collection
    {
        /** @var Collection<int, Portfolio> */
        return $this->model
            ->where('user_id', $userId)
            ->with('items.security')
            ->get();
    }

    /**
     * Find a portfolio by ID with its items and security relationships loaded.
     */
    public function findWithItems(int $id): ?Portfolio
    {
        /** @var Portfolio|null */
        return $this->model
            ->with('items.security')
            ->find($id);
    }

    /**
     * Find a portfolio by ID with items, securities, and market data loaded.
     */
    public function findWithMarketData(int $id): ?Portfolio
    {
        /** @var Portfolio|null */
        return $this->model
            ->with(['items.security.marketData' => function ($query) {
                $query->orderBy('timestamp', 'desc')->limit(1);
            }])
            ->find($id);
    }
}
