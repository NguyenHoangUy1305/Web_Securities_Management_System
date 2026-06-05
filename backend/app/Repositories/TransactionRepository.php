<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class TransactionRepository extends BaseRepository
{
    public function __construct(Transaction $transaction)
    {
        parent::__construct($transaction);
    }

    /**
     * Retrieve transactions for a specific user with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return Collection<int, Transaction>
     */
    public function getByUser(int $userId, array $filters = []): Collection
    {
        return $this->applyFilters(
            $this->model->with(['security', 'portfolio'])->where('user_id', $userId),
            $filters
        )->orderBy('executed_at', 'desc')->get();
    }

    /**
     * Retrieve paginated transactions for a specific user with optional filters.
     *
     * @param array<string, mixed> $filters
     */
    public function getByUserPaginated(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->applyFilters(
            $this->model->with(['security', 'portfolio'])->where('user_id', $userId),
            $filters
        )->orderBy('executed_at', 'desc')->paginate($perPage);
    }

    /**
     * Retrieve transactions for a specific portfolio with optional filters.
     *
     * @param array<string, mixed> $filters
     * @return Collection<int, Transaction>
     */
    public function getByPortfolio(int $portfolioId, array $filters = []): Collection
    {
        return $this->applyFilters(
            $this->model->with(['security'])->where('portfolio_id', $portfolioId),
            $filters
        )->orderBy('executed_at', 'desc')->get();
    }

    /**
     * Retrieve transactions within a date range.
     *
     * @return Collection<int, Transaction>
     */
    public function getByDateRange(string $from, string $to): Collection
    {
        /** @var Collection<int, Transaction> */
        return $this->model
            ->with(['user', 'portfolio', 'security'])
            ->whereBetween('executed_at', [$from, $to])
            ->orderBy('executed_at', 'desc')
            ->get();
    }

    /**
     * Retrieve transactions for a specific security.
     *
     * @return Collection<int, Transaction>
     */
    public function getBySecurity(int $securityId): Collection
    {
        /** @var Collection<int, Transaction> */
        return $this->model
            ->with(['user', 'portfolio'])
            ->where('security_id', $securityId)
            ->orderBy('executed_at', 'desc')
            ->get();
    }

    /**
     * Apply common filters to the query builder.
     *
     * @param array<string, mixed> $filters
     */
    private function applyFilters(Builder $query, array $filters): Builder
    {
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['security_id'])) {
            $query->where('security_id', (int) $filters['security_id']);
        }

        if (!empty($filters['portfolio_id'])) {
            $query->where('portfolio_id', (int) $filters['portfolio_id']);
        }

        if (!empty($filters['from'])) {
            $query->where('executed_at', '>=', $filters['from']);
        }

        if (!empty($filters['to'])) {
            $query->where('executed_at', '<=', $filters['to']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('executed_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('executed_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['min_amount'])) {
            $query->where('total_amount', '>=', (float) $filters['min_amount']);
        }

        if (!empty($filters['max_amount'])) {
            $query->where('total_amount', '<=', (float) $filters['max_amount']);
        }

        if (!empty($filters['order_id'])) {
            $query->where('order_id', (int) $filters['order_id']);
        }

        return $query;
    }
}
