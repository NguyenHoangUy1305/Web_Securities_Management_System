<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\MarketData;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MarketDataRepository extends BaseRepository
{
    public function __construct(MarketData $marketData)
    {
        parent::__construct($marketData);
    }

    /**
     * Retrieve OHLC (Open, High, Low, Close) data for a security within a date range.
     *
     * @param  int         $securityId
     * @param  string      $from      ISO date string.
     * @param  string      $to        ISO date string.
     * @param  string      $interval  Aggregation interval: '1d', '1w', '1m'.
     * @return Collection<int, MarketData>
     */
    public function getOHLC(
        int $securityId,
        string $from,
        string $to,
        string $interval = '1d'
    ): Collection {
        $query = $this->model
            ->where('security_id', $securityId)
            ->where('timestamp', '>=', $from)
            ->where('timestamp', '<=', $to)
            ->orderBy('timestamp');

        // For daily data return raw records.
        if ($interval === '1d') {
            /** @var Collection<int, MarketData> */
            return $query->get();
        }

        // For weekly or monthly intervals, aggregate manually.
        $dateFormat = match ($interval) {
            '1w'    => '%Y-%u',   // ISO-week
            '1m'    => '%Y-%m',   // year-month
            default => '%Y-%m-%d',
        };

        /** @var Collection<int, MarketData> */
        return $query
            ->select(
                'security_id',
                DB::raw("DATE_FORMAT(timestamp, '{$dateFormat}') as period"),
                DB::raw('MIN(open) as open'),
                DB::raw('MAX(high) as high'),
                DB::raw('MIN(low) as low'),
                DB::raw('MAX(close) as close'),
                DB::raw('SUM(volume) as volume')
            )
            ->groupBy('security_id', 'period')
            ->orderBy('period')
            ->get();
    }

    /**
     * Get the latest market data point (most recent timestamp) for a security.
     */
    public function getLatestPrice(int $securityId): ?MarketData
    {
        /** @var MarketData|null */
        return $this->model
            ->where('security_id', $securityId)
            ->orderByDesc('timestamp')
            ->first();
    }

    /**
     * Retrieve historical market data for a security going back a given number of days.
     *
     * @return Collection<int, MarketData>
     */
    public function getHistoricalData(int $securityId, int $days = 30): Collection
    {
        $cutoff = Carbon::now()->subDays($days);

        /** @var Collection<int, MarketData> */
        return $this->model
            ->where('security_id', $securityId)
            ->where('timestamp', '>=', $cutoff)
            ->orderBy('timestamp')
            ->get();
    }

    /**
     * Get the latest price for each of the given security IDs.
     *
     * @param  int[] $securityIds
     * @return Collection<int, MarketData>
     */
    public function getLatestForSecurities(array $securityIds): Collection
    {
        /** @var Collection<int, MarketData> */
        return $this->model
            ->whereIn('security_id', $securityIds)
            ->whereIn('id', function ($q) use ($securityIds) {
                $q->selectRaw('MAX(id)')
                  ->from('market_data')
                  ->whereIn('security_id', $securityIds)
                  ->groupBy('security_id');
            })
            ->get()
            ->keyBy('security_id');
    }
}
