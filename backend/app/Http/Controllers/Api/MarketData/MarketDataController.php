<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\MarketData;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\MarketDataResource;
use App\Services\MarketDataService;
use App\Services\TechnicalIndicatorService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MarketDataController extends BaseController
{
    protected MarketDataService $marketDataService;

    protected TechnicalIndicatorService $technicalIndicatorService;

    public function __construct(
        MarketDataService $marketDataService,
        TechnicalIndicatorService $technicalIndicatorService
    ) {
        $this->marketDataService          = $marketDataService;
        $this->technicalIndicatorService  = $technicalIndicatorService;
    }

    /**
     * Retrieve historical market data for a security.
     *
     * GET /api/market-data/{securityId}/history?days=30
     */
    public function history(Request $request, int $securityId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'days' => 'nullable|integer|min:1|max:365',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $days    = (int) ($request->input('days', 30));
            $records = $this->marketDataService
                ->getHistoricalDataBySecurity($securityId, $days);

            return $this->sendResponse(
                MarketDataResource::collection($records),
                'Historical market data retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve historical market data.',
                500
            );
        }
    }

    /**
     * Retrieve OHLC data for a security within a date range.
     *
     * GET /api/market-data/{securityId}/ohlc?from=...&to=...&interval=1d
     */
    public function ohlc(Request $request, int $securityId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from'     => 'required|date',
            'to'       => 'required|date|after_or_equal:from',
            'interval' => 'nullable|in:1d,1w,1m',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $from     = $request->input('from');
            $to       = $request->input('to');
            $interval = $request->input('interval', '1d');

            $records = $this->marketDataService->getOHLCData($securityId, $from, $to, $interval);

            return $this->sendResponse(
                MarketDataResource::collection($records),
                'OHLC data retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve OHLC data.',
                500
            );
        }
    }

    /**
     * Get the latest price for one or more securities.
     *
     * GET /api/market-data/latest?ids[]=1&ids[]=2
     */
    public function latest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ids'   => 'required|array',
            'ids.*' => 'integer|min:1|exists:securities,id',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $ids    = $request->input('ids', []);
            $result = $this->marketDataService->getLatestPrices($ids);

            if ($result === null) {
                return $this->sendError('No data found.', 404);
            }

            if ($result instanceof \App\Models\MarketData) {
                return $this->sendResponse(
                    new MarketDataResource($result),
                    'Latest price retrieved successfully.'
                );
            }

            return $this->sendResponse(
                MarketDataResource::collection($result),
                'Latest prices retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve latest prices.',
                500
            );
        }
    }

    /**
     * Retrieve technical indicators for a security.
     *
     * GET /api/market-data/{securityId}/indicators?from=...&to=...
     */
    public function indicators(Request $request, int $securityId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from' => 'nullable|date',
            'to'   => 'nullable|date|after_or_equal:from',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $from       = $request->input('from');
            $to         = $request->input('to');
            $indicators = $this->technicalIndicatorService->getIndicators($securityId, $from, $to);

            return $this->sendResponse(
                $indicators,
                'Technical indicators retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve technical indicators.',
                500
            );
        }
    }
}
