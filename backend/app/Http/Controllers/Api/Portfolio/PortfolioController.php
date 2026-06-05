<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Portfolio;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\PortfolioCollection;
use App\Http\Resources\PortfolioResource;
use App\Models\Portfolio;
use App\Services\PortfolioService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;

class PortfolioController extends BaseController
{
    protected PortfolioService $portfolioService;

    public function __construct(PortfolioService $portfolioService)
    {
        $this->portfolioService = $portfolioService;
    }

    /**
     * Display a paginated list of portfolios for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $perPage = (int) ($request->input('per_page', 15));

            $portfolios = Portfolio::where('user_id', $request->user()->id)
                ->with('items.security')
                ->paginate($perPage);

            return $this->sendResponse(
                new PortfolioCollection($portfolios),
                'Portfolios retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve portfolios.',
                500
            );
        }
    }

    /**
     * Store a newly created portfolio.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'cash_balance' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $data = array_merge($validator->validated(), [
                'user_id'     => $request->user()->id,
                'total_value' => $request->input('cash_balance', 0),
            ]);

            $portfolio = $this->portfolioService->create($data);

            return $this->sendResponse(
                new PortfolioResource($portfolio),
                'Portfolio created successfully.',
                201
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Display the specified portfolio.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $portfolio = $this->portfolioService->getPortfolioWithItems($id);

            if (!$portfolio) {
                return $this->sendError('Portfolio not found.', 404);
            }

            if ($portfolio->user_id !== $request->user()->id) {
                return $this->sendError('Forbidden.', 403);
            }

            return $this->sendResponse(
                new PortfolioResource($portfolio),
                'Portfolio retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve portfolio.',
                500
            );
        }
    }

    /**
     * Update the specified portfolio.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'cash_balance' => 'sometimes|required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $portfolio = $this->portfolioService->getById($id);

            if (!$portfolio) {
                return $this->sendError('Portfolio not found.', 404);
            }

            if ($portfolio->user_id !== $request->user()->id) {
                return $this->sendError('Forbidden.', 403);
            }

            $this->portfolioService->update($id, $validator->validated());

            // If cash_balance changed, recalculate the total value.
            if ($request->has('cash_balance')) {
                $portfolio->fresh()->recalculateTotalValue();
            }

            return $this->sendResponse(
                new PortfolioResource($portfolio->fresh()),
                'Portfolio updated successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to update portfolio.',
                500
            );
        }
    }

    /**
     * Remove the specified portfolio (soft-delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $portfolio = $this->portfolioService->getById($id);

            if (!$portfolio) {
                return $this->sendError('Portfolio not found.', 404);
            }

            if ($portfolio->user_id !== $request->user()->id) {
                return $this->sendError('Forbidden.', 403);
            }

            $this->portfolioService->delete($id);

            return $this->sendResponse(null, 'Portfolio deleted successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to delete portfolio.',
                500
            );
        }
    }

    /**
     * Get a portfolio summary including total value, cash, and sector allocation.
     */
    public function summary(Request $request, int $id): JsonResponse
    {
        try {
            $portfolio = $this->portfolioService->getById($id);

            if (!$portfolio) {
                return $this->sendError('Portfolio not found.', 404);
            }

            if ($portfolio->user_id !== $request->user()->id) {
                return $this->sendError('Forbidden.', 403);
            }

            $summary = $this->portfolioService->getSummary($id);

            return $this->sendResponse(
                $summary,
                'Portfolio summary retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve portfolio summary.',
                500
            );
        }
    }

    /**
     * Get detailed asset allocation for the portfolio.
     */
    public function allocation(Request $request, int $id): JsonResponse
    {
        try {
            $portfolio = $this->portfolioService->getById($id);

            if (!$portfolio) {
                return $this->sendError('Portfolio not found.', 404);
            }

            if ($portfolio->user_id !== $request->user()->id) {
                return $this->sendError('Forbidden.', 403);
            }

            $allocations = $this->portfolioService->getAssetAllocation($id);

            return $this->sendResponse(
                $allocations,
                'Asset allocation retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve asset allocation.',
                500
            );
        }
    }

    /**
     * Calculate portfolio performance over a date range.
     */
    public function performance(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from' => 'required|date',
            'to'   => 'required|date|after_or_equal:from',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $portfolio = $this->portfolioService->getById($id);

            if (!$portfolio) {
                return $this->sendError('Portfolio not found.', 404);
            }

            if ($portfolio->user_id !== $request->user()->id) {
                return $this->sendError('Forbidden.', 403);
            }

            $from = $request->input('from');
            $to   = $request->input('to');

            $performance = $this->portfolioService->calculatePerformance($id, $from, $to);

            return $this->sendResponse(
                $performance,
                'Portfolio performance calculated successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to calculate portfolio performance.',
                500
            );
        }
    }
}
