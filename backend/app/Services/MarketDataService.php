<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\MarketData;
use App\Models\TechnicalIndicator;
use App\Repositories\MarketDataRepository;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class MarketDataService extends BaseService
{
    protected MarketDataRepository $marketDataRepository;

    public function __construct(MarketDataRepository $marketDataRepository)
    {
        parent::__construct($marketDataRepository);
        $this->marketDataRepository = $marketDataRepository;
    }

    // ── Data retrieval ─────────────────────────────────────────────────

    /**
     * Retrieve OHLC data for a security.
     */
    public function getOHLCData(
        int $securityId,
        string $from,
        string $to,
        string $interval = '1d'
    ): Collection {
        return $this->marketDataRepository->getOHLC($securityId, $from, $to, $interval);
    }

    /**
     * Get the latest price for one or more securities.
     *
     * @param  int[] $ids
     * @return MarketData|Collection<int, MarketData>|null
     */
    public function getLatestPrices(array $ids = []): mixed
    {
        if (empty($ids)) {
            return null;
        }

        if (count($ids) === 1) {
            return $this->marketDataRepository->getLatestPrice($ids[0]);
        }

        return $this->marketDataRepository->getLatestForSecurities($ids);
    }

    /**
     * Store a single market data point.
     */
    public function storeMarketDataPoint(array $data): MarketData
    {
        /** @var MarketData */
        return $this->marketDataRepository->create($data);
    }

    /**
     * Retrieve historical market data for a security going back a given number of days.
     *
     * @return Collection<int, MarketData>
     */
    public function getHistoricalDataBySecurity(int $securityId, int $days = 30): Collection
    {
        return $this->marketDataRepository->getHistoricalData($securityId, $days);
    }

    // ── Technical indicator calculations ───────────────────────────────

    /**
     * Calculate the Relative Strength Index (RSI) for a security.
     *
     * Uses Wilder's smoothed RSI method over the given period.
     *
     * @return array<int, array{timestamp: string, rsi: float|null}>
     */
    public function calculateRSI(int $securityId, int $period = 14): array
    {
        /** @var Collection<int, MarketData> $records */
        $records = $this->marketDataRepository
            ->getHistoricalData($securityId, $period * 3)
            ->sortBy('timestamp')
            ->values();

        if ($records->count() < $period + 1) {
            return [];
        }

        $gains = [];
        $losses = [];
        $closes = $records->pluck('close')->toArray();

        // Calculate price changes.
        for ($i = 1, $len = count($closes); $i < $len; $i++) {
            $change  = $closes[$i] - $closes[$i - 1];
            $gains[] = $change > 0 ? $change : 0.0;
            $losses[] = $change < 0 ? -$change : 0.0;
        }

        // First average gain / loss (simple mean over the first period).
        $avgGain = array_sum(array_slice($gains, 0, $period)) / $period;
        $avgLoss = array_sum(array_slice($losses, 0, $period)) / $period;

        $result = [];
        $timestamps = $records->pluck('timestamp')->toArray();

        // The first RSI value is available at index = period.
        for ($i = $period; $i <= count($gains); $i++) {
            if ($i > $period) {
                // Wilder's smoothing: Avg = (Prev Avg * (period-1) + Current) / period
                $avgGain = (($avgGain * ($period - 1)) + $gains[$i - 1]) / $period;
                $avgLoss = (($avgLoss * ($period - 1)) + $losses[$i - 1]) / $period;
            }

            $rs  = $avgLoss > 0 ? $avgGain / $avgLoss : ($avgGain > 0 ? 100.0 : 50.0);
            $rsi = 100.0 - (100.0 / (1.0 + $rs));

            $ts = $timestamps[$i] instanceof Carbon
                ? $timestamps[$i]->toISOString()
                : (string) $timestamps[$i];

            $result[] = [
                'timestamp' => $ts,
                'rsi'       => round($rsi, 4),
            ];
        }

        return $result;
    }

    /**
     * Calculate MACD (Moving Average Convergence Divergence) for a security.
     *
     * @return array<int, array{timestamp: string, macd_line: float|null, macd_signal: float|null, macd_histogram: float|null}>
     */
    public function calculateMACD(
        int $securityId,
        int $fast = 12,
        int $slow = 26,
        int $signal = 9
    ): array {
        /** @var Collection<int, MarketData> $records */
        $records = $this->marketDataRepository
            ->getHistoricalData($securityId, $slow + $signal + 50)
            ->sortBy('timestamp')
            ->values();

        $closes = $records->pluck('close')->toArray();
        $count  = count($closes);

        if ($count < $slow + $signal) {
            return [];
        }

        // Calculate EMAs.
        $emaFast = $this->emaValues($closes, $fast);
        $emaSlow = $this->emaValues($closes, $slow);

        // MACD line = EMA(fast) - EMA(slow) — aligned from the slow period onward.
        $macdLine = [];
        $startIdx = $slow - 1; // first index where both EMAs are defined
        for ($i = $startIdx; $i < $count; $i++) {
            $macdLine[] = $emaFast[$i] - $emaSlow[$i];
        }

        if (count($macdLine) < $signal) {
            return [];
        }

        // Signal line = EMA(signal) of the MACD line.
        $macdSignal = $this->emaValues($macdLine, $signal);

        // Build result, aligned to the slow + signal - 1 offset.
        $result    = [];
        $timestamps = $records->pluck('timestamp')->toArray();
        $offset    = $startIdx + $signal - 1;

        for ($i = $offset, $j = $signal - 1; $i < $count; $i++, $j++) {
            $line     = $macdLine[$j];
            $sig      = $macdSignal[$j];
            $hist     = $line - $sig;

            $ts = $timestamps[$i] instanceof Carbon
                ? $timestamps[$i]->toISOString()
                : (string) $timestamps[$i];

            $result[] = [
                'timestamp'      => $ts,
                'macd_line'      => round($line, 4),
                'macd_signal'    => round($sig, 4),
                'macd_histogram' => round($hist, 4),
            ];
        }

        return $result;
    }

    /**
     * Calculate Simple Moving Average (SMA) for a security.
     *
     * @return array<int, array{timestamp: string, sma: float|null}>
     */
    public function calculateSMA(int $securityId, int $period): array
    {
        /** @var Collection<int, MarketData> $records */
        $records = $this->marketDataRepository
            ->getHistoricalData($securityId, $period + 10)
            ->sortBy('timestamp')
            ->values();

        $closes = $records->pluck('close')->toArray();
        $count  = count($closes);

        if ($count < $period) {
            return [];
        }

        $result    = [];
        $timestamps = $records->pluck('timestamp')->toArray();

        for ($i = $period - 1; $i < $count; $i++) {
            $sum = 0.0;
            for ($j = $i - $period + 1; $j <= $i; $j++) {
                $sum += $closes[$j];
            }
            $sma = $sum / $period;

            $ts = $timestamps[$i] instanceof Carbon
                ? $timestamps[$i]->toISOString()
                : (string) $timestamps[$i];

            $result[] = [
                'timestamp' => $ts,
                'sma'       => round($sma, 4),
            ];
        }

        return $result;
    }

    /**
     * Calculate Exponential Moving Average (EMA) for a security.
     *
     * @return array<int, array{timestamp: string, ema: float|null}>
     */
    public function calculateEMA(int $securityId, int $period): array
    {
        /** @var Collection<int, MarketData> $records */
        $records = $this->marketDataRepository
            ->getHistoricalData($securityId, $period + 10)
            ->sortBy('timestamp')
            ->values();

        $closes = $records->pluck('close')->toArray();
        $count  = count($closes);

        if ($count < $period) {
            return [];
        }

        $emaArr = $this->emaValues($closes, $period);

        $result    = [];
        $timestamps = $records->pluck('timestamp')->toArray();

        for ($i = $period - 1; $i < $count; $i++) {
            $ts = $timestamps[$i] instanceof Carbon
                ? $timestamps[$i]->toISOString()
                : (string) $timestamps[$i];

            $result[] = [
                'timestamp' => $ts,
                'ema'       => round($emaArr[$i], 4),
            ];
        }

        return $result;
    }

    /**
     * Calculate RSI and persist it as a TechnicalIndicator record for the
     * latest market data point.
     */
    public function calculateAndStoreRSI(int $securityId, int $period = 14): void
    {
        $latest = $this->marketDataRepository->getLatestPrice($securityId);
        if ($latest === null) {
            return;
        }

        $rsiValues = $this->calculateRSI($securityId, $period);
        if (empty($rsiValues)) {
            return;
        }

        $latestRsi = end($rsiValues);

        TechnicalIndicator::updateOrCreate(
            [
                'market_data_id' => $latest->id,
                'security_id'    => $securityId,
            ],
            [
                'timestamp' => $latest->timestamp,
                'rsi_14'    => $latestRsi['rsi'],
            ]
        );
    }

    // ── Internal helpers ────────────────────────────────────────────────

    /**
     * Compute EMA values for an entire close-price array.
     *
     * The first EMA(period) is seeded with SMA(period) of the first `period` values.
     *
     * @param  float[] $values
     * @param  int     $period
     * @return float[] Same length as $values; positions before $period-1 are 0.0.
     */
    private function emaValues(array $values, int $period): array
    {
        $count = count($values);
        $ema   = array_fill(0, $count, 0.0);

        if ($count < $period) {
            return $ema;
        }

        // Seed: SMA of the first $period values.
        $seedSum = 0.0;
        for ($i = 0; $i < $period; $i++) {
            $seedSum += $values[$i];
        }
        $ema[$period - 1] = $seedSum / $period;

        $multiplier = 2.0 / ($period + 1);

        for ($i = $period; $i < $count; $i++) {
            $ema[$i] = (($values[$i] - $ema[$i - 1]) * $multiplier) + $ema[$i - 1];
        }

        return $ema;
    }
}
