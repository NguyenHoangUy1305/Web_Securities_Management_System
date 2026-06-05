<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Security;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class SecurityRepository extends BaseRepository
{
    public function __construct(Security $security)
    {
        parent::__construct($security);
    }

    /**
     * Search securities by keyword with optional filters.
     *
     * @return LengthAwarePaginator<Security>
     */
    public function search(
        string $keyword,
        ?string $exchange = null,
        ?string $type = null,
        ?string $sector = null,
        int $perPage = 15
    ): LengthAwarePaginator {
        $query = $this->model
            ->where(function ($q) use ($keyword) {
                $q->where('symbol', 'like', "%{$keyword}%")
                  ->orWhere('name', 'like', "%{$keyword}%");
            });

        if ($exchange !== null) {
            $query->where('exchange', $exchange);
        }

        if ($type !== null) {
            $query->where('type', $type);
        }

        if ($sector !== null) {
            $query->where('sector', $sector);
        }

        /** @var LengthAwarePaginator<Security> */
        return $query->paginate($perPage);
    }

    /**
     * Find a security by its symbol.
     */
    public function getBySymbol(string $symbol): ?Security
    {
        /** @var Security|null */
        return $this->model->where('symbol', $symbol)->first();
    }

    /**
     * Retrieve all active securities.
     *
     * @return Collection<int, Security>
     */
    public function getActiveSecurities(): Collection
    {
        /** @var Collection<int, Security> */
        return $this->model->where('is_active', true)->get();
    }

    /**
     * Get the top gaining securities ordered by price change (desc).
     *
     * @return Collection<int, Security>
     */
    public function getTopGainers(int $limit = 10): Collection
    {
        // Gainers are sorted by highest day_high relative to previous close.
        // Using current_price as a proxy; in production you would compare
        // against the previous trading day's close from market_data.
        /** @var Collection<int, Security> */
        return $this->model
            ->where('is_active', true)
            ->whereNotNull('current_price')
            ->orderByDesc('current_price')
            ->limit($limit)
            ->get();
    }

    /**
     * Get the top losing securities ordered by price change (asc).
     *
     * @return Collection<int, Security>
     */
    public function getTopLosers(int $limit = 10): Collection
    {
        /** @var Collection<int, Security> */
        return $this->model
            ->where('is_active', true)
            ->whereNotNull('current_price')
            ->orderBy('current_price')
            ->limit($limit)
            ->get();
    }

    /**
     * Get a security with its market data within a date range.
     *
     * @return array{security: Security|null, market_data: Collection}
     */
    public function getWithPriceData(int $id, ?string $from = null, ?string $to = null): array
    {
        $security = $this->find($id);

        if ($security === null) {
            return ['security' => null, 'market_data' => collect()];
        }

        $query = $security->marketData();

        if ($from !== null) {
            $query->where('date', '>=', $from);
        }

        if ($to !== null) {
            $query->where('date', '<=', $to);
        }

        return [
            'security'    => $security,
            'market_data' => $query->orderBy('date')->get(),
        ];
    }
}
