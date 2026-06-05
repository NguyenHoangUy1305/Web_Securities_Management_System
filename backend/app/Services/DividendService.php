<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Dividend;
use App\Models\PortfolioDividend;
use App\Models\Security;
use App\Repositories\DividendRepository;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class DividendService extends BaseService
{
    protected DividendRepository $dividendRepository;

    public function __construct(DividendRepository $dividendRepository)
    {
        parent::__construct($dividendRepository);
        $this->dividendRepository = $dividendRepository;
    }

    // ── Upcoming dividends ─────────────────────────────────────────────

    /**
     * Get all upcoming dividends (ex_date >= today).
     *
     * @return Collection<int, Dividend>
     */
    public function getUpcomingDividends(): Collection
    {
        /** @var Collection<int, Dividend> */
        return Dividend::with('security')
            ->where('ex_date', '>=', Carbon::today())
            ->orderBy('ex_date')
            ->get();
    }

    // ── Historical dividends ───────────────────────────────────────────

    /**
     * Get historical dividends for a specific security.
     *
     * @return Collection<int, Dividend>
     */
    public function getHistoricalDividends(int $securityId): Collection
    {
        /** @var Collection<int, Dividend> */
        return Dividend::with('security')
            ->where('security_id', $securityId)
            ->where('ex_date', '<', Carbon::today())
            ->orderBy('ex_date', 'desc')
            ->get();
    }

    // ── Record dividend payment ────────────────────────────────────────

    /**
     * Record a dividend payment received for a portfolio holding.
     *
     * @return array{portfolio_dividend: PortfolioDividend, dividend: Dividend}
     */
    public function recordDividendPayment(
        int $portfolioId,
        int $dividendId,
        float $shares
    ): array {
        /** @var Dividend|null $dividend */
        $dividend = Dividend::with('security')->find($dividendId);

        if ($dividend === null) {
            throw new \RuntimeException('Dividend not found.');
        }

        $totalAmount = round($shares * (float) $dividend->amount_per_share, 2);

        /** @var PortfolioDividend $portfolioDividend */
        $portfolioDividend = PortfolioDividend::create([
            'portfolio_id'  => $portfolioId,
            'dividend_id'   => $dividendId,
            'security_id'   => $dividend->security_id,
            'shares_owned'  => $shares,
            'total_amount'  => $totalAmount,
            'received_date' => Carbon::today(),
        ]);

        return [
            'portfolio_dividend' => $portfolioDividend,
            'dividend'           => $dividend,
        ];
    }

    // ── Dividend income ────────────────────────────────────────────────

    /**
     * Get total dividend income for a user within a date range, broken
     * down by individual payments and with a grand total.
     *
     * @return array{total: float, payments: Collection}
     */
    public function getDividendIncome(int $userId, string $from, string $to): array
    {
        $payments = PortfolioDividend::with(['dividend.security', 'portfolio'])
            ->whereHas('portfolio', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->whereBetween('received_date', [$from, $to])
            ->orderBy('received_date', 'desc')
            ->get();

        $total = round($payments->sum(fn ($pd) => (float) $pd->total_amount), 2);

        return [
            'total'    => $total,
            'payments' => $payments,
        ];
    }

    // ── Dividend yield ─────────────────────────────────────────────────

    /**
     * Calculate the trailing twelve-month dividend yield for a security.
     *
     * Yield = (sum of amount_per_share over the past 12 months) / current_price * 100
     *
     * @return array{yield_percent: ?float, annual_dividend: ?float, current_price: ?float}
     */
    public function calculateDividendYield(int $securityId): array
    {
        /** @var Security|null $security */
        $security = Security::find($securityId);

        if ($security === null) {
            return [
                'yield_percent'  => null,
                'annual_dividend' => null,
                'current_price'  => null,
            ];
        }

        $oneYearAgo = Carbon::today()->subYear();

        $annualDividend = (float) Dividend::where('security_id', $securityId)
            ->where('ex_date', '>=', $oneYearAgo)
            ->sum('amount_per_share');

        $currentPrice = $security->current_price !== null
            ? (float) $security->current_price
            : null;

        $yieldPercent = null;
        if ($currentPrice !== null && $currentPrice > 0 && $annualDividend > 0) {
            $yieldPercent = round(($annualDividend / $currentPrice) * 100, 4);
        }

        return [
            'yield_percent'   => $yieldPercent,
            'annual_dividend' => round($annualDividend, 4),
            'current_price'   => $currentPrice,
        ];
    }

    // ── Dividend calendar ──────────────────────────────────────────────

    /**
     * Get all dividends (upcoming and historical) within a date range,
     * filtered by ex_date.
     *
     * @return Collection<int, Dividend>
     */
    public function getDividendCalendar(string $from, string $to): Collection
    {
        /** @var Collection<int, Dividend> */
        return Dividend::with('security')
            ->where(function ($query) use ($from, $to) {
                $query->whereBetween('ex_date', [$from, $to])
                    ->orWhereBetween('payment_date', [$from, $to]);
            })
            ->orderBy('ex_date')
            ->get();
    }
}
