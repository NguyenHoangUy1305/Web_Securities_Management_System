<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Dividends;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\DividendResource;
use App\Models\Dividend;
use App\Services\DividendService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DividendController extends BaseController
{
    protected DividendService $dividendService;

    public function __construct(DividendService $dividendService)
    {
        $this->dividendService = $dividendService;
    }

    /**
     * Display a paginated list of all dividends.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'per_page'    => 'nullable|integer|min:1|max:100',
            'security_id' => 'nullable|integer|exists:securities,id',
            'type'        => 'nullable|string|in:cash,stock',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $query = Dividend::with('security');

            if ($request->filled('security_id')) {
                $query->where('security_id', (int) $request->input('security_id'));
            }

            if ($request->filled('symbol')) {
                $symbol = strtoupper($request->input('symbol'));
                $query->whereHas('security', fn($q) => $q->where('symbol', 'like', "%{$symbol}%"));
            }

            if ($request->filled('type')) {
                $query->where('dividend_type', $request->input('type'));
            }

            $perPage = (int) ($request->input('per_page', 15));
            $dividends = $query->orderBy('ex_date', 'desc')->paginate($perPage);

            return $this->sendResponse(
                DividendResource::collection($dividends),
                'Dividends retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve dividends.',
                500
            );
        }
    }

    /**
     * Display the specified dividend.
     */
    public function show(int $id): JsonResponse
    {
        try {
            /** @var Dividend|null $dividend */
            $dividend = Dividend::with('security')->find($id);

            if ($dividend === null) {
                return $this->sendError('Dividend not found.', 404);
            }

            return $this->sendResponse(
                new DividendResource($dividend),
                'Dividend retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve dividend.',
                500
            );
        }
    }

    /**
     * Get all upcoming dividends (ex_date >= today).
     */
    public function upcoming(): JsonResponse
    {
        try {
            $dividends = $this->dividendService->getUpcomingDividends();

            return $this->sendResponse(
                DividendResource::collection($dividends),
                'Upcoming dividends retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve upcoming dividends.',
                500
            );
        }
    }

    /**
     * Get historical dividends for a specific security.
     */
    public function historical(int $securityId): JsonResponse
    {
        try {
            $dividends = $this->dividendService->getHistoricalDividends($securityId);

            return $this->sendResponse(
                DividendResource::collection($dividends),
                'Historical dividends retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve historical dividends.',
                500
            );
        }
    }

    /**
     * Get dividend payments for the authenticated user's portfolios.
     */
    public function myDividends(Request $request): JsonResponse
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
            $user  = $request->user();
            $from  = $request->input('from', now()->subYear()->toDateString());
            $to    = $request->input('to', now()->toDateString());

            $income = $this->dividendService->getDividendIncome($user->id, $from, $to);

            return $this->sendResponse(
                $income,
                'Dividend income retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve dividend income.',
                500
            );
        }
    }

    /**
     * Get dividend calendar for a given date range.
     */
    public function calendar(string $from, string $to): JsonResponse
    {
        try {
            $dividends = $this->dividendService->getDividendCalendar($from, $to);

            return $this->sendResponse(
                DividendResource::collection($dividends),
                'Dividend calendar retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve dividend calendar.',
                500
            );
        }
    }

    /**
     * Record a dividend payment for a portfolio.
     */
    public function record(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'portfolio_id' => 'required|integer|exists:portfolios,id',
            'dividend_id'  => 'required|integer|exists:dividends,id',
            'shares_owned' => 'required|numeric|min:0.0001',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $result = $this->dividendService->recordDividendPayment(
                (int) $request->input('portfolio_id'),
                (int) $request->input('dividend_id'),
                (float) $request->input('shares_owned')
            );

            return $this->sendResponse(
                [
                    'portfolio_dividend' => $result['portfolio_dividend'],
                    'dividend'           => new DividendResource($result['dividend']->load('security')),
                ],
                'Dividend payment recorded successfully.',
                201
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 500
            );
        }
    }
}
