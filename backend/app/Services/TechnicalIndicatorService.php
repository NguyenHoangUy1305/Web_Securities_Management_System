<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\MarketData;
use App\Models\TechnicalIndicator;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class TechnicalIndicatorService
{
    protected MarketDataService $marketDataService;

    public function __construct(MarketDataService $marketDataService)
    {
        $this->marketDataService = $marketDataService;
    }

    /**
     * Calculate all standard technical indicators for a security and persist them
     * as TechnicalIndicator records linked to each market data row.
     *
     * @return int Number of indicator records created/updated.
     */
    public function calculateAll(int $securityId): int
    {
        $rsiData   = $this->marketDataService->calculateRSI($securityId, 14);
        $macdData  = $this->marketDataService->calculateMACD($securityId);
        $sma20Data = $this->marketDataService->calculateSMA($securityId, 20);
        $sma50Data = $this->marketDataService->calculateSMA($securityId, 50);
        $sma200Data = $this->marketDataService->calculateSMA($securityId, 200);
        $ema12Data = $this->marketDataService->calculateEMA($securityId, 12);
        $ema26Data = $this->marketDataService->calculateEMA($securityId, 26);

        // Index each result set by timestamp for a merge-join.
        $indexByTimestamp = function (array $rows): array {
            $map = [];
            foreach ($rows as $row) {
                $map[$row['timestamp']] = $row;
            }
            return $map;
        };

        $rsiIdx   = $indexByTimestamp($rsiData);
        $macdIdx  = $indexByTimestamp($macdData);
        $sma20Idx = $indexByTimestamp($sma20Data);
        $sma50Idx = $indexByTimestamp($sma50Data);
        $sma200Idx = $indexByTimestamp($sma200Data);
        $ema12Idx = $indexByTimestamp($ema12Data);
        $ema26Idx = $indexByTimestamp($ema26Data);

        // Gather all unique timestamps across all indicator sets.
        $allTimestamps = array_unique(array_merge(
            array_keys($rsiIdx),
            array_keys($macdIdx),
            array_keys($sma20Idx),
            array_keys($sma50Idx),
            array_keys($sma200Idx),
            array_keys($ema12Idx),
            array_keys($ema26Idx)
        ));
        sort($allTimestamps);

        if (empty($allTimestamps)) {
            return 0;
        }

        // Fetch the relevant MarketData records to obtain market_data_id.
        /** @var Collection<int, MarketData> $marketDataRecords */
        $marketDataRecords = MarketData::where('security_id', $securityId)
            ->whereIn('timestamp', $allTimestamps)
            ->get()
            ->keyBy(fn (MarketData $md) => $md->timestamp instanceof Carbon
                ? $md->timestamp->toISOString()
                : (string) $md->timestamp
            );

        $updated = 0;

        foreach ($allTimestamps as $ts) {
            /** @var MarketData|null $md */
            $md = $marketDataRecords->get($ts);
            if ($md === null) {
                continue;
            }

            TechnicalIndicator::updateOrCreate(
                [
                    'market_data_id' => $md->id,
                    'security_id'    => $securityId,
                ],
                [
                    'timestamp'      => $md->timestamp,
                    'rsi_14'         => $rsiIdx[$ts]['rsi'] ?? null,
                    'macd_line'      => $macdIdx[$ts]['macd_line'] ?? null,
                    'macd_signal'    => $macdIdx[$ts]['macd_signal'] ?? null,
                    'macd_histogram' => $macdIdx[$ts]['macd_histogram'] ?? null,
                    'sma_20'         => $sma20Idx[$ts]['sma'] ?? null,
                    'sma_50'         => $sma50Idx[$ts]['sma'] ?? null,
                    'sma_200'        => $sma200Idx[$ts]['sma'] ?? null,
                    'ema_12'         => $ema12Idx[$ts]['ema'] ?? null,
                    'ema_26'         => $ema26Idx[$ts]['ema'] ?? null,
                ]
            );

            $updated++;
        }

        return $updated;
    }

    /**
     * Retrieve stored technical indicators for a security within an optional date range.
     *
     * @return Collection<int, TechnicalIndicator>
     */
    public function getIndicators(
        int $securityId,
        ?string $from = null,
        ?string $to = null
    ): Collection {
        $query = TechnicalIndicator::where('security_id', $securityId);

        if ($from !== null) {
            $query->where('timestamp', '>=', $from);
        }

        if ($to !== null) {
            $query->where('timestamp', '<=', $to);
        }

        /** @var Collection<int, TechnicalIndicator> */
        return $query->orderBy('timestamp')->get();
    }
}
