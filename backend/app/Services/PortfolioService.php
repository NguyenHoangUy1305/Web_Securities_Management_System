<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Portfolio;
use App\Models\PortfolioItem;
use App\Models\MarketData;
use App\Repositories\PortfolioItemRepository;
use App\Repositories\PortfolioRepository;
use Illuminate\Support\Collection;

class PortfolioService extends BaseService
{
    protected PortfolioRepository $portfolioRepository;

    protected PortfolioItemRepository $portfolioItemRepository;

    public function __construct(
        PortfolioRepository $portfolioRepository,
        PortfolioItemRepository $portfolioItemRepository
    ) {
        parent::__construct($portfolioRepository);
        $this->portfolioRepository = $portfolioRepository;
        $this->portfolioItemRepository = $portfolioItemRepository;
    }

    // ── Portfolio CRUD ──────────────────────────────────────────────────

    /**
     * Create a new portfolio for a given user.
     */
    public function create(array $data): Portfolio
    {
        /** @var Portfolio */
        return $this->portfolioRepository->create($data);
    }

    /**
     * Get a portfolio with its items and security relationships loaded.
     */
    public function getPortfolioWithItems(int $id): ?Portfolio
    {
        return $this->portfolioRepository->findWithItems($id);
    }

    // ── Summary ─────────────────────────────────────────────────────────

    /**
     * Build a summary of the portfolio including total value, cash balance,
     * and percentage allocation by sector.
     *
     * @return array{total_value: float, cash_balance: float, invested: float, allocation_by_sector: array}
     */
    public function getSummary(int $id): array
    {
        $portfolio = $this->portfolioRepository->findWithItems($id);

        if ($portfolio === null) {
            return [
                'total_value'         => 0.0,
                'cash_balance'        => 0.0,
                'invested'            => 0.0,
                'allocation_by_sector' => [],
            ];
        }

        $cashBalance = (float) $portfolio->cash_balance;
        $holdingsValue = 0.0;
        $totalInvested = 0.0;
        $sectorValues = [];

        /** @var PortfolioItem $item */
        foreach ($portfolio->items as $item) {
            $security = $item->security;
            if ($security === null) {
                continue;
            }

            $currentVal = $item->current_value ?? 0.0;
            $costBasis   = (float) $item->avg_buy_price * (float) $item->quantity;

            $holdingsValue += $currentVal;
            $totalInvested  += $costBasis;

            $sector = $security->sector ?? 'Uncategorised';
            $sectorValues[$sector] = ($sectorValues[$sector] ?? 0.0) + $currentVal;
        }

        $totalValue = $holdingsValue + $cashBalance;

        // Calculate sector percentages.
        $allocationBySector = [];
        foreach ($sectorValues as $sector => $value) {
            $allocationBySector[] = [
                'sector'     => $sector,
                'value'      => round($value, 2),
                'percentage' => $totalValue > 0
                    ? round(($value / $totalValue) * 100, 2)
                    : 0.0,
            ];
        }

        // Sort by percentage descending.
        usort($allocationBySector, function (array $a, array $b) {
            return $b['percentage'] <=> $a['percentage'];
        });

        return [
            'total_value'         => round($totalValue, 2),
            'cash_balance'        => round($cashBalance, 2),
            'invested'            => round($totalInvested, 2),
            'allocation_by_sector' => $allocationBySector,
        ];
    }

    // ── Asset allocation ───────────────────────────────────────────────

    /**
     * Return a detailed breakdown of every holding in the portfolio.
     *
     * @return array<int, array>
     */
    public function getAssetAllocation(int $id): array
    {
        $portfolio = $this->portfolioRepository->findWithItems($id);

        if ($portfolio === null) {
            return [];
        }

        $totalValue = (float) $portfolio->total_value;

        $allocations = [];

        /** @var PortfolioItem $item */
        foreach ($portfolio->items as $item) {
            $security = $item->security;
            if ($security === null) {
                continue;
            }

            $currentVal   = $item->current_value ?? 0.0;
            $profitLoss   = $item->profit_loss ?? 0.0;
            $profitLossPct = $item->profit_loss_percent;

            $allocations[] = [
                'security_id'        => $security->id,
                'symbol'             => $security->symbol,
                'name'               => $security->name,
                'sector'             => $security->sector,
                'type'               => $security->type,
                'quantity'           => (float) $item->quantity,
                'avg_buy_price'      => (float) $item->avg_buy_price,
                'current_price'      => $security->current_price !== null ? (float) $security->current_price : null,
                'current_value'      => $currentVal,
                'cost_basis'         => round((float) $item->avg_buy_price * (float) $item->quantity, 2),
                'profit_loss'        => $profitLoss,
                'profit_loss_percent' => $profitLossPct,
                'allocation_percent'  => $totalValue > 0
                    ? round(($currentVal / $totalValue) * 100, 2)
                    : 0.0,
            ];
        }

        // Sort by allocation percentage descending.
        usort($allocations, function (array $a, array $b) {
            return $b['allocation_percent'] <=> $a['allocation_percent'];
        });

        return $allocations;
    }

    // ── Performance ────────────────────────────────────────────────────

    /**
     * Estimate portfolio performance over a given date range by pulling
     * historical market data for each holding.
     *
     * @return array<string, mixed>
     */
    public function calculatePerformance(int $id, string $from, string $to): array
    {
        $portfolio = $this->portfolioRepository->findWithItems($id);

        if ($portfolio === null) {
            return [
                'portfolio_id'      => $id,
                'from'              => $from,
                'to'                => $to,
                'start_value'       => 0.0,
                'end_value'         => 0.0,
                'absolute_return'   => 0.0,
                'percentage_return' => 0.0,
                'holdings'          => [],
            ];
        }

        $cashBalance = (float) $portfolio->cash_balance;
        $holdingsPerformance = [];
        $startTotal = $cashBalance;
        $endTotal   = $cashBalance;

        /** @var PortfolioItem $item */
        foreach ($portfolio->items as $item) {
            $security = $item->security;
            if ($security === null) {
                continue;
            }

            $quantity = (float) $item->quantity;

            // Find the closest market data point on or before $from and $to.
            $startPrice = $this->getPriceAtDate($security->id, $from);
            $endPrice   = $this->getPriceAtDate($security->id, $to);

            // If no historical data is available, fall back to avg_buy_price
            // for start and current_price for end.
            if ($startPrice === null) {
                $startPrice = (float) $item->avg_buy_price;
            }
            if ($endPrice === null) {
                $endPrice = $security->current_price !== null
                    ? (float) $security->current_price
                    : $startPrice;
            }

            $startVal  = round($quantity * $startPrice, 2);
            $endVal    = round($quantity * $endPrice, 2);
            $returnAmt = round($endVal - $startVal, 2);
            $returnPct = $startVal > 0
                ? round(($returnAmt / $startVal) * 100, 2)
                : 0.0;

            $startTotal += $startVal;
            $endTotal   += $endVal;

            $holdingsPerformance[] = [
                'security_id'          => $security->id,
                'symbol'               => $security->symbol,
                'name'                 => $security->name,
                'quantity'             => $quantity,
                'start_price'          => round($startPrice, 2),
                'end_price'            => round($endPrice, 2),
                'start_value'          => $startVal,
                'end_value'            => $endVal,
                'absolute_return'      => $returnAmt,
                'percentage_return'    => $returnPct,
            ];
        }

        $absoluteReturn = round($endTotal - $startTotal, 2);
        $percentageReturn = $startTotal > 0
            ? round(($absoluteReturn / $startTotal) * 100, 2)
            : 0.0;

        return [
            'portfolio_id'       => $id,
            'from'               => $from,
            'to'                 => $to,
            'start_value'        => round($startTotal, 2),
            'end_value'          => round($endTotal, 2),
            'absolute_return'    => $absoluteReturn,
            'percentage_return'  => $percentageReturn,
            'holdings'           => $holdingsPerformance,
        ];
    }

    // ── Holdings management ────────────────────────────────────────────

    /**
     * Add or update a holding in the portfolio.
     *
     * If the security already exists in the portfolio, the quantity and
     * average buy price are adjusted using a weighted average.
     */
    public function addHolding(int $portfolioId, array $data): PortfolioItem
    {
        $securityId  = (int) $data['security_id'];
        $quantity    = (float) ($data['quantity'] ?? 0);
        $buyPrice    = (float) ($data['avg_buy_price'] ?? 0);

        $existing = $this->portfolioItemRepository->findByPortfolioAndSecurity(
            $portfolioId,
            $securityId
        );

        if ($existing) {
            // Weighted average cost basis.
            $existingQty  = (float) $existing->quantity;
            $existingCost = (float) $existing->avg_buy_price;

            $totalQty   = $existingQty + $quantity;
            $totalCost  = ($existingQty * $existingCost) + ($quantity * $buyPrice);
            $newAvgPrice = $totalQty > 0 ? $totalCost / $totalQty : 0;

            $existing->update([
                'quantity'      => $totalQty,
                'avg_buy_price' => round($newAvgPrice, 4),
            ]);

            $item = $existing->fresh();
        } else {
            $item = $this->portfolioItemRepository->create([
                'portfolio_id'  => $portfolioId,
                'security_id'   => $securityId,
                'quantity'      => $quantity,
                'avg_buy_price' => $buyPrice,
            ]);
        }

        // Reload the item with its security so accessors can compute.
        /** @var PortfolioItem|null $item */
        $item = $this->portfolioItemRepository->find($item->id);
        if ($item !== null) {
            $item->load('security');
        }

        // Recalculate portfolio total value.
        $this->recalculatePortfolioValue($portfolioId);

        return $item;
    }

    /**
     * Recalculate and persist the current value/profit metrics for a holding.
     * This syncs the dynamic computed values back to stored columns.
     */
    public function updateHoldingValue(int $id): ?PortfolioItem
    {
        /** @var PortfolioItem|null $item */
        $item = $this->portfolioItemRepository->find($id);

        if ($item === null) {
            return null;
        }

        $item->load('security');

        // Persist the currently-computed values back to the database columns
        // so they can be queried without always needing the relationship.
        $currentVal = $item->current_value;
        $profitLoss = $item->profit_loss;
        $profitLossPct = $item->profit_loss_percent;

        $item->update([
            'current_value'       => $currentVal ?? 0,
            'profit_loss'         => $profitLoss ?? 0,
            'profit_loss_percent' => $profitLossPct ?? 0,
        ]);

        // Recalculate portfolio total value.
        $this->recalculatePortfolioValue($item->portfolio_id);

        return $item->fresh();
    }

    /**
     * Bulk-update stored values for all holdings in a portfolio.
     */
    public function updateAllHoldingValues(int $portfolioId): void
    {
        $items = $this->portfolioItemRepository->getByPortfolioWithSecurity($portfolioId);

        foreach ($items as $item) {
            $currentVal = $item->current_value;
            $profitLoss = $item->profit_loss;
            $profitLossPct = $item->profit_loss_percent;

            $item->update([
                'current_value'       => $currentVal ?? 0,
                'profit_loss'         => $profitLoss ?? 0,
                'profit_loss_percent' => $profitLossPct ?? 0,
            ]);
        }

        $this->recalculatePortfolioValue($portfolioId);
    }

    /**
     * Remove a holding from the portfolio.
     */
    public function removeHolding(int $id): bool
    {
        $item = $this->portfolioItemRepository->find($id);

        if ($item === null) {
            return false;
        }

        $portfolioId = $item->portfolio_id;
        $deleted = $this->portfolioItemRepository->delete($id);

        if ($deleted) {
            $this->recalculatePortfolioValue($portfolioId);
        }

        return $deleted;
    }

    // ── Internal helpers ───────────────────────────────────────────────

    /**
     * Recalculate the total_value of a portfolio from its holdings + cash.
     */
    private function recalculatePortfolioValue(int $portfolioId): void
    {
        $portfolio = $this->portfolioRepository->find($portfolioId);
        if ($portfolio !== null) {
            $portfolio->recalculateTotalValue();
        }
    }

    /**
     * Get the closest closing price for a security on or before a given date.
     */
    private function getPriceAtDate(int $securityId, string $date): ?float
    {
        /** @var MarketData|null $record */
        $record = MarketData::where('security_id', $securityId)
            ->where('timestamp', '<=', $date)
            ->orderBy('timestamp', 'desc')
            ->first();

        if ($record !== null && $record->close !== null) {
            return (float) $record->close;
        }

        return null;
    }
}
