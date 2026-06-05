<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;

class OrderRepository extends BaseRepository
{
    public function __construct(Order $order)
    {
        parent::__construct($order);
    }

    /**
     * Retrieve all pending orders with their relationships loaded.
     *
     * @return Collection<int, Order>
     */
    public function getPendingOrders(): Collection
    {
        /** @var Collection<int, Order> */
        return $this->model
            ->with(['user', 'portfolio', 'security'])
            ->where('status', OrderStatus::Pending)
            ->get();
    }

    /**
     * Retrieve all orders belonging to a specific user.
     *
     * @return Collection<int, Order>
     */
    public function getOrdersByUser(int $userId): Collection
    {
        /** @var Collection<int, Order> */
        return $this->model
            ->with(['portfolio', 'security'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Retrieve all orders for a specific portfolio.
     *
     * @return Collection<int, Order>
     */
    public function getOrdersByPortfolio(int $portfolioId): Collection
    {
        /** @var Collection<int, Order> */
        return $this->model
            ->with(['security'])
            ->where('portfolio_id', $portfolioId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Retrieve orders filtered by status.
     *
     * @return Collection<int, Order>
     */
    public function getOrdersByStatus(OrderStatus $status): Collection
    {
        /** @var Collection<int, Order> */
        return $this->model
            ->with(['user', 'portfolio', 'security'])
            ->where('status', $status)
            ->get();
    }

    /**
     * Find an order by ID with its relationships loaded.
     */
    public function findWithRelations(int $id): ?Order
    {
        /** @var Order|null */
        return $this->model
            ->with(['user', 'portfolio', 'security'])
            ->find($id);
    }
}
