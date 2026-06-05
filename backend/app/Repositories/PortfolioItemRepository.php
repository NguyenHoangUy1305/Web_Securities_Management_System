<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\PortfolioItem;
use Illuminate\Database\Eloquent\Collection;

class PortfolioItemRepository extends BaseRepository
{
    public function __construct(PortfolioItem $portfolioItem)
    {
        parent::__construct($portfolioItem);
    }

    /**
     * Find the portfolio item for a specific portfolio and security.
     */
    public function findByPortfolioAndSecurity(int $portfolioId, int $securityId): ?PortfolioItem
    {
        /** @var PortfolioItem|null */
        return $this->model
            ->where('portfolio_id', $portfolioId)
            ->where('security_id', $securityId)
            ->first();
    }

    /**
     * Get all items for a portfolio with their security relationships.
     *
     * @return Collection<int, PortfolioItem>
     */
    public function getByPortfolioWithSecurity(int $portfolioId): Collection
    {
        /** @var Collection<int, PortfolioItem> */
        return $this->model
            ->where('portfolio_id', $portfolioId)
            ->with('security')
            ->get();
    }
}
