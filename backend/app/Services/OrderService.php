<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderSide;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Events\OrderFilled;
use App\Events\OrderPlaced;
use App\Models\Order;
use App\Models\Portfolio;
use App\Models\PortfolioItem;
use App\Models\Security;
use App\Repositories\OrderRepository;
use App\Repositories\PortfolioItemRepository;
use App\Repositories\PortfolioRepository;
use App\Repositories\SecurityRepository;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OrderService extends BaseService
{
    protected OrderRepository $orderRepository;

    protected PortfolioRepository $portfolioRepository;

    protected PortfolioItemRepository $portfolioItemRepository;

    protected SecurityRepository $securityRepository;

    public function __construct(
        OrderRepository $orderRepository,
        PortfolioRepository $portfolioRepository,
        PortfolioItemRepository $portfolioItemRepository,
        SecurityRepository $securityRepository
    ) {
        parent::__construct($orderRepository);
        $this->orderRepository = $orderRepository;
        $this->portfolioRepository = $portfolioRepository;
        $this->portfolioItemRepository = $portfolioItemRepository;
        $this->securityRepository = $securityRepository;
    }

    // ── Order Placement ─────────────────────────────────────────────────

    /**
     * Validate input data, check portfolio balance / available quantity,
     * and create a new order.
     *
     * @param array<string, mixed> $data
     * @return array{order: Order, errors?: array<string, mixed>}
     *
     * @throws Exception
     */
    public function placeOrder(array $data): array
    {
        /** @var Security|null $security */
        $security = $this->securityRepository->find((int) $data['security_id']);
        if ($security === null) {
            throw new Exception('Security not found.', 404);
        }

        /** @var Portfolio|null $portfolio */
        $portfolio = $this->portfolioRepository->find((int) $data['portfolio_id']);
        if ($portfolio === null) {
            throw new Exception('Portfolio not found.', 404);
        }

        $side      = $data['type'] ?? 'buy';
        $quantity  = (float) ($data['quantity'] ?? 0);
        $price     = isset($data['price']) ? (float) $data['price'] : ($security->current_price !== null ? (float) $security->current_price : null);
        $orderType = $data['order_type'] ?? 'market';

        if ($quantity <= 0) {
            throw new Exception('Quantity must be greater than zero.', 422);
        }

        if ($orderType === OrderType::Limit->value && ($price === null || $price <= 0)) {
            throw new Exception('Limit orders require a valid price.', 422);
        }

        $totalAmount = $price !== null ? round($quantity * $price, 2) : null;

        // ── Validation for buy / sell ────────────────────────────────

        if ($side === OrderSide::Buy->value) {
            // For buy orders, ensure the portfolio has enough cash balance.
            if ($totalAmount !== null && (float) $portfolio->cash_balance < $totalAmount) {
                throw new Exception('Insufficient cash balance.', 422);
            }
        } elseif ($side === OrderSide::Sell->value) {
            // For sell orders, ensure the portfolio holds enough quantity.
            $holding = $this->portfolioItemRepository->findByPortfolioAndSecurity(
                $portfolio->id,
                $security->id
            );

            $heldQty = $holding !== null ? (float) $holding->quantity : 0;

            if ($heldQty < $quantity) {
                throw new Exception('Insufficient securities in portfolio.', 422);
            }
        } else {
            throw new Exception('Invalid order type. Must be "buy" or "sell".', 422);
        }

        // ── Create the order ─────────────────────────────────────────

        $orderData = [
            'user_id'       => $portfolio->user_id,
            'portfolio_id'  => $portfolio->id,
            'security_id'   => $security->id,
            'type'          => $side,
            'order_type'    => $orderType,
            'quantity'      => $quantity,
            'price'         => $price,
            'total_amount'  => $totalAmount,
            'status'        => OrderStatus::Pending->value,
            'filled_quantity' => 0,
            'filled_price'  => null,
            'expires_at'    => $data['expires_at'] ?? null,
        ];

        DB::beginTransaction();
        try {
            /** @var Order $order */
            $order = $this->orderRepository->create($orderData);
            $order->load(['user', 'portfolio', 'security']);

            // For market buy orders, if there is an immediate match, fill it.
            if ($orderType === OrderType::Market->value) {
                $this->fillOrderInternal($order, $quantity, $price ?? 0);
            }

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }

        // Broadcast the event.
        event(new OrderPlaced($order));

        return ['order' => $order];
    }

    // ── Cancel Order ────────────────────────────────────────────────────

    /**
     * Cancel an order if it is in a cancellable state.
     *
     * @throws Exception
     */
    public function cancelOrder(int $id): Order
    {
        /** @var Order|null $order */
        $order = $this->orderRepository->findWithRelations($id);

        if ($order === null) {
            throw new Exception('Order not found.', 404);
        }

        if (!in_array($order->status, [OrderStatus::Pending, OrderStatus::Open], true)) {
            throw new Exception(
                'Only pending or open orders can be cancelled.',
                422
            );
        }

        $order->update([
            'status' => OrderStatus::Cancelled,
        ]);

        /** @var Order $order */
        $order = $order->fresh();

        return $order;
    }

    // ── Modify Order ────────────────────────────────────────────────────

    /**
     * Modify an existing pending/open order (e.g., change quantity, price).
     *
     * @param array<string, mixed> $data
     * @throws Exception
     */
    public function modifyOrder(int $id, array $data): Order
    {
        /** @var Order|null $order */
        $order = $this->orderRepository->findWithRelations($id);

        if ($order === null) {
            throw new Exception('Order not found.', 404);
        }

        if (!in_array($order->status, [OrderStatus::Pending, OrderStatus::Open], true)) {
            throw new Exception(
                'Only pending or open orders can be modified.',
                422
            );
        }

        $updateData = [];

        if (isset($data['quantity'])) {
            $updateData['quantity'] = (float) $data['quantity'];
        }

        if (isset($data['price'])) {
            $updateData['price'] = (float) $data['price'];
        }

        if (isset($data['expires_at'])) {
            $updateData['expires_at'] = $data['expires_at'];
        }

        // Recalculate total_amount if quantity or price changed.
        $newQuantity = (float) ($updateData['quantity'] ?? $order->quantity);
        $newPrice    = $updateData['price'] ?? $order->price;
        if ($newPrice !== null) {
            $updateData['total_amount'] = round($newQuantity * (float) $newPrice, 2);
        }

        $order->update($updateData);

        /** @var Order $order */
        $order = $order->fresh();
        $order->load(['user', 'portfolio', 'security']);

        return $order;
    }

    // ── Fill Order ──────────────────────────────────────────────────────

    /**
     * Fill (partially or fully) an order and update the portfolio holdings.
     *
     * @throws Exception
     */
    public function fillOrder(int $id, float $quantity, float $price): Order
    {
        /** @var Order|null $order */
        $order = $this->orderRepository->findWithRelations($id);

        if ($order === null) {
            throw new Exception('Order not found.', 404);
        }

        if ($order->status === OrderStatus::Filled) {
            throw new Exception('Order is already fully filled.', 422);
        }

        if ($order->status === OrderStatus::Cancelled || $order->status === OrderStatus::Rejected) {
            throw new Exception('Cannot fill a cancelled or rejected order.', 422);
        }

        DB::beginTransaction();
        try {
            $this->fillOrderInternal($order, $quantity, $price);
            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $order->fresh();
    }

    /**
     * Internal fill logic that updates the order, portfolio holdings,
     * and broadcasts the OrderFilled event.
     */
    private function fillOrderInternal(Order $order, float $quantity, float $price): void
    {
        $previouslyFilled = (float) ($order->filled_quantity ?? 0);
        $totalQuantity    = (float) $order->quantity;
        $newFilledQty     = $previouslyFilled + $quantity;

        // Cap at total quantity.
        if ($newFilledQty > $totalQuantity) {
            $newFilledQty = $totalQuantity;
        }

        $isFullyFilled = abs($newFilledQty - $totalQuantity) < 1e-8;

        $updateData = [
            'filled_quantity' => $newFilledQty,
            'filled_price'    => $price,
            'status'          => $isFullyFilled ? OrderStatus::Filled : OrderStatus::Partial,
        ];

        $order->update($updateData);

        // ── Update portfolio holdings ────────────────────────────────
        $portfolioId = $order->portfolio_id;
        $securityId  = $order->security_id;
        $side        = $order->type;

        if ($side === OrderSide::Buy) {
            // Increase holding or create new one.
            $existing = $this->portfolioItemRepository->findByPortfolioAndSecurity(
                $portfolioId,
                $securityId
            );

            if ($existing) {
                $existingQty  = (float) $existing->quantity;
                $existingCost = (float) $existing->avg_buy_price;

                $totalQty    = $existingQty + $quantity;
                $totalCost   = ($existingQty * $existingCost) + ($quantity * $price);
                $newAvgPrice = $totalQty > 0 ? $totalCost / $totalQty : 0;

                $existing->update([
                    'quantity'      => $totalQty,
                    'avg_buy_price' => round($newAvgPrice, 4),
                ]);
            } else {
                $this->portfolioItemRepository->create([
                    'portfolio_id'  => $portfolioId,
                    'security_id'   => $securityId,
                    'quantity'      => $quantity,
                    'avg_buy_price' => $price,
                ]);
            }

            // Deduct cost from cash balance.
            $cost = round($quantity * $price, 2);
            $portfolio = $this->portfolioRepository->find($portfolioId);
            if ($portfolio !== null) {
                $portfolio->decrement('cash_balance', $cost);
                $portfolio->recalculateTotalValue();
            }
        } elseif ($side === OrderSide::Sell) {
            // Decrease holding.
            $existing = $this->portfolioItemRepository->findByPortfolioAndSecurity(
                $portfolioId,
                $securityId
            );

            if ($existing !== null) {
                $existingQty = (float) $existing->quantity;
                $remainingQty = $existingQty - $quantity;

                if ($remainingQty <= 0) {
                    $existing->delete();
                } else {
                    $existing->update([
                        'quantity' => $remainingQty,
                    ]);
                }
            }

            // Add proceeds to cash balance.
            $proceeds = round($quantity * $price, 2);
            $portfolio = $this->portfolioRepository->find($portfolioId);
            if ($portfolio !== null) {
                $portfolio->increment('cash_balance', $proceeds);
                $portfolio->recalculateTotalValue();
            }
        }

        // ── Build transaction data ───────────────────────────────────
        $transaction = [
            'user_id'       => $order->user_id,
            'portfolio_id'  => $portfolioId,
            'security_id'   => $securityId,
            'type'          => $side->value,
            'quantity'      => $quantity,
            'price'         => $price,
            'total_amount'  => round($quantity * $price, 2),
            'order_id'      => $order->id,
            'executed_at'   => now()->toISOString(),
        ];

        // Broadcast the fill event.
        event(new OrderFilled($order->fresh(), $transaction));
    }

    // ── Order Book ──────────────────────────────────────────────────────

    /**
     * Get the order book for a given security, grouped by buy and sell orders.
     *
     * @return array<string, mixed>
     */
    public function getOrderBook(int $securityId): array
    {
        $openOrders = $this->model
            ->with(['user', 'portfolio'])
            ->where('security_id', $securityId)
            ->whereIn('status', [OrderStatus::Pending, OrderStatus::Open, OrderStatus::Partial])
            ->orderBy('created_at', 'desc')
            ->get();

        $buyOrders  = [];
        $sellOrders = [];

        foreach ($openOrders as $order) {
            $entry = [
                'id'          => $order->id,
                'user_id'     => $order->user_id,
                'portfolio_id' => $order->portfolio_id,
                'type'        => $order->type->value,
                'order_type'  => $order->order_type->value,
                'quantity'    => (float) $order->quantity,
                'price'       => $order->price !== null ? (float) $order->price : null,
                'filled'      => (float) ($order->filled_quantity ?? 0),
                'remaining'   => (float) $order->quantity - (float) ($order->filled_quantity ?? 0),
                'status'      => $order->status->value,
                'created_at'  => $order->created_at?->toISOString(),
            ];

            if ($order->type === OrderSide::Buy) {
                $buyOrders[] = $entry;
            } else {
                $sellOrders[] = $entry;
            }
        }

        return [
            'security_id' => $securityId,
            'buy_orders'  => $buyOrders,
            'sell_orders' => $sellOrders,
        ];
    }

    // ── Process Pending Orders ──────────────────────────────────────────

    /**
     * Process pending/open orders for a given security.
     * For market orders, attempt to fill at the current market price.
     * For limit orders, fill if the limit condition is met.
     */
    public function processPendingOrders(int $securityId): void
    {
        /** @var Security|null $security */
        $security = $this->securityRepository->find($securityId);

        if ($security === null || $security->current_price === null) {
            return;
        }

        $currentPrice = (float) $security->current_price;

        $pendingOrders = $this->model
            ->where('security_id', $securityId)
            ->whereIn('status', [OrderStatus::Pending, OrderStatus::Open, OrderStatus::Partial])
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($pendingOrders as $order) {
            /** @var Order $order */
            $orderType = $order->order_type;
            $side      = $order->type;
            $remaining = (float) $order->quantity - (float) ($order->filled_quantity ?? 0);

            if ($remaining <= 0) {
                continue;
            }

            $shouldFill = false;

            if ($orderType === OrderType::Market) {
                $shouldFill = true;
            } elseif ($orderType === OrderType::Limit) {
                $limitPrice = (float) $order->price;
                if ($side === OrderSide::Buy && $currentPrice <= $limitPrice) {
                    $shouldFill = true;
                } elseif ($side === OrderSide::Sell && $currentPrice >= $limitPrice) {
                    $shouldFill = true;
                }
            } elseif ($orderType === OrderType::Stop) {
                $stopPrice = (float) $order->price;
                if ($side === OrderSide::Buy && $currentPrice >= $stopPrice) {
                    $shouldFill = true;
                } elseif ($side === OrderSide::Sell && $currentPrice <= $stopPrice) {
                    $shouldFill = true;
                }
            }

            if ($shouldFill) {
                DB::beginTransaction();
                try {
                    $this->fillOrderInternal($order, $remaining, $currentPrice);
                    DB::commit();
                } catch (Exception $e) {
                    DB::rollBack();
                    // Mark the order as rejected on failure.
                    $order->update(['status' => OrderStatus::Rejected]);
                }
            }
        }
    }

    // ── Validate Order ──────────────────────────────────────────────────

    /**
     * Validate whether an order is still valid based on current market conditions
     * and portfolio state.
     *
     * @return array<string, mixed>
     */
    public function validateOrder(Order $order): array
    {
        $issues = [];

        if ($order->status === OrderStatus::Cancelled) {
            $issues[] = 'Order has been cancelled.';
        }

        if ($order->status === OrderStatus::Rejected) {
            $issues[] = 'Order has been rejected.';
        }

        if ($order->expires_at !== null && now()->greaterThan($order->expires_at)) {
            $issues[] = 'Order has expired.';
        }

        // Check that the portfolio still exists and has sufficient balance.
        /** @var Portfolio|null $portfolio */
        $portfolio = $this->portfolioRepository->find($order->portfolio_id);
        if ($portfolio === null) {
            $issues[] = 'Portfolio no longer exists.';
        }

        // Check that the security is still active.
        /** @var Security|null $security */
        $security = $this->securityRepository->find($order->security_id);
        if ($security === null || !$security->is_active) {
            $issues[] = 'Security is no longer active.';
        }

        $remaining = (float) $order->quantity - (float) ($order->filled_quantity ?? 0);

        if ($portfolio !== null && $order->type === OrderSide::Buy && $remaining > 0) {
            $requiredCash = round($remaining * (float) ($order->price ?? 0), 2);
            if ((float) $portfolio->cash_balance < $requiredCash) {
                $issues[] = 'Insufficient cash balance to fill remaining quantity.';
            }
        }

        if ($portfolio !== null && $security !== null && $order->type === OrderSide::Sell && $remaining > 0) {
            $holding = $this->portfolioItemRepository->findByPortfolioAndSecurity(
                $portfolio->id,
                $security->id
            );
            $heldQty = $holding !== null ? (float) $holding->quantity : 0;
            if ($heldQty < $remaining) {
                $issues[] = 'Insufficient securities in portfolio to fill remaining quantity.';
            }
        }

        return [
            'valid'  => empty($issues),
            'issues' => $issues,
        ];
    }
}
