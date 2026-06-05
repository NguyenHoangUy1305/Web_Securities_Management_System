<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Securities;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\SecurityCollection;
use App\Http\Resources\SecurityResource;
use App\Models\Security;
use App\Services\SecurityService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SecurityController extends BaseController
{
    protected SecurityService $securityService;

    public function __construct(SecurityService $securityService)
    {
        $this->securityService = $securityService;
    }

    /**
     * Display a paginated, filterable list of securities.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'per_page' => 'nullable|integer|min:1|max:100',
            'type'     => 'nullable|string|max:50',
            'sector'   => 'nullable|string|max:255',
            'exchange' => 'nullable|string|max:50',
            'search'   => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $perPage  = (int) ($request->input('per_page', 15));
            $type     = $request->input('type');
            $sector   = $request->input('sector');
            $exchange = $request->input('exchange');
            $search   = $request->input('search');

            if ($search) {
                $securities = $this->securityService->search($search, $exchange, $type, $sector, $perPage);
            } else {
                $query = Security::query();

                if ($type !== null) {
                    $query->byType($type);
                }

                if ($sector !== null) {
                    $query->bySector($sector);
                }

                if ($exchange !== null) {
                    $query->where('exchange', $exchange);
                }

                $securities = $query->paginate($perPage);
            }

            return $this->sendResponse(
                new SecurityCollection($securities),
                'Securities retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve securities.',
                500
            );
        }
    }

    /**
     * Store a newly created security.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'symbol'         => 'required|string|max:20|unique:securities,symbol',
            'name'           => 'required|string|max:255',
            'exchange'       => 'required|string|max:50',
            'type'           => 'required|string|max:50',
            'sector'         => 'nullable|string|max:255',
            'industry'       => 'nullable|string|max:255',
            'market_cap'     => 'nullable|numeric|min:0',
            'current_price'  => 'nullable|numeric|min:0',
            'eps'            => 'nullable|numeric',
            'pe_ratio'       => 'nullable|numeric|min:0',
            'dividend_yield' => 'nullable|numeric|min:0',
            'volume'         => 'nullable|integer|min:0',
            'day_high'       => 'nullable|numeric|min:0',
            'day_low'        => 'nullable|numeric|min:0',
            'year_high'      => 'nullable|numeric|min:0',
            'year_low'       => 'nullable|numeric|min:0',
            'is_active'      => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $security = $this->securityService->create($validator->validated());

            return $this->sendResponse(
                new SecurityResource($security),
                'Security created successfully.',
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
     * Display the specified security.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $security = $this->securityService->getById($id);

            if (!$security) {
                return $this->sendError('Security not found.', 404);
            }

            return $this->sendResponse(
                new SecurityResource($security),
                'Security retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve security.',
                500
            );
        }
    }

    /**
     * Update the specified security.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'symbol'         => 'sometimes|required|string|max:20|unique:securities,symbol,' . $id,
            'name'           => 'sometimes|required|string|max:255',
            'exchange'       => 'sometimes|required|string|max:50',
            'type'           => 'sometimes|required|string|max:50',
            'sector'         => 'nullable|string|max:255',
            'industry'       => 'nullable|string|max:255',
            'market_cap'     => 'nullable|numeric|min:0',
            'current_price'  => 'nullable|numeric|min:0',
            'eps'            => 'nullable|numeric',
            'pe_ratio'       => 'nullable|numeric|min:0',
            'dividend_yield' => 'nullable|numeric|min:0',
            'volume'         => 'nullable|integer|min:0',
            'day_high'       => 'nullable|numeric|min:0',
            'day_low'        => 'nullable|numeric|min:0',
            'year_high'      => 'nullable|numeric|min:0',
            'year_low'       => 'nullable|numeric|min:0',
            'is_active'      => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $security = $this->securityService->getById($id);

            if (!$security) {
                return $this->sendError('Security not found.', 404);
            }

            $this->securityService->update($id, $validator->validated());

            return $this->sendResponse(
                new SecurityResource($security->fresh()),
                'Security updated successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to update security.',
                500
            );
        }
    }

    /**
     * Remove the specified security (soft-delete).
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $security = $this->securityService->getById($id);

            if (!$security) {
                return $this->sendError('Security not found.', 404);
            }

            $this->securityService->delete($id);

            return $this->sendResponse(null, 'Security deleted successfully.');
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to delete security.',
                500
            );
        }
    }

    /**
     * Search securities by keyword with optional filters.
     */
    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'keyword'  => 'required|string|max:255',
            'exchange' => 'nullable|string|max:50',
            'type'     => 'nullable|string|max:50',
            'sector'   => 'nullable|string|max:255',
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
            $keyword  = $request->input('keyword');
            $exchange = $request->input('exchange');
            $type     = $request->input('type');
            $sector   = $request->input('sector');
            $perPage  = (int) ($request->input('per_page', 15));

            $securities = $this->securityService->search($keyword, $exchange, $type, $sector, $perPage);

            return $this->sendResponse(
                new SecurityCollection($securities),
                'Search completed successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to search securities.',
                500
            );
        }
    }

    /**
     * Get the top gaining securities.
     */
    public function topGainers(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $limit      = (int) ($request->input('limit', 10));
            $securities = $this->securityService->getTopGainers($limit);

            return $this->sendResponse(
                new SecurityCollection($securities),
                'Top gainers retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve top gainers.',
                500
            );
        }
    }

    /**
     * Get the top losing securities.
     */
    public function topLosers(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $limit      = (int) ($request->input('limit', 10));
            $securities = $this->securityService->getTopLosers($limit);

            return $this->sendResponse(
                new SecurityCollection($securities),
                'Top losers retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve top losers.',
                500
            );
        }
    }

    /**
     * Find a security by its symbol.
     */
    public function getBySymbol(string $symbol): JsonResponse
    {
        try {
            $security = $this->securityService->getBySymbol($symbol);

            if (!$security) {
                return $this->sendError('Security not found.', 404);
            }

            return $this->sendResponse(
                new SecurityResource($security),
                'Security retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve security.',
                500
            );
        }
    }
}
