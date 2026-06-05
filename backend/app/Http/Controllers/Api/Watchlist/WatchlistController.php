<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Watchlist;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\WatchlistResource;
use App\Models\Watchlist;
use App\Services\WatchlistService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WatchlistController extends BaseController
{
    protected WatchlistService $watchlistService;

    public function __construct(WatchlistService $watchlistService)
    {
        $this->watchlistService = $watchlistService;
    }

    /**
     * Display all watchlists for the authenticated user.
     */
    public function index(): JsonResponse
    {
        try {
            $watchlists = $this->watchlistService->getWatchlists(auth()->id());

            return $this->sendResponse(
                WatchlistResource::collection($watchlists),
                'Watchlists retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError('Failed to retrieve watchlists.', 500);
        }
    }

    /**
     * Store a newly created watchlist.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $watchlist = $this->watchlistService->createWatchlist(
                auth()->id(),
                $request->input('name')
            );

            return $this->sendResponse(
                new WatchlistResource($watchlist),
                'Watchlist created successfully.',
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
     * Display the specified watchlist.
     */
    public function show(int $id): JsonResponse
    {
        try {
            /** @var Watchlist|null $watchlist */
            $watchlist = $this->watchlistService->getById($id);

            if (!$watchlist || $watchlist->user_id !== auth()->id()) {
                return $this->sendError('Watchlist not found.', 404);
            }

            $watchlist->load('items.security');

            return $this->sendResponse(
                new WatchlistResource($watchlist),
                'Watchlist retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError('Failed to retrieve watchlist.', 500);
        }
    }

    /**
     * Update the specified watchlist.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            /** @var Watchlist|null $watchlist */
            $watchlist = $this->watchlistService->getById($id);

            if (!$watchlist || $watchlist->user_id !== auth()->id()) {
                return $this->sendError('Watchlist not found.', 404);
            }

            $this->watchlistService->update($id, $validator->validated());

            return $this->sendResponse(
                new WatchlistResource($watchlist->fresh()),
                'Watchlist updated successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError('Failed to update watchlist.', 500);
        }
    }

    /**
     * Remove the specified watchlist.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            /** @var Watchlist|null $watchlist */
            $watchlist = $this->watchlistService->getById($id);

            if (!$watchlist || $watchlist->user_id !== auth()->id()) {
                return $this->sendError('Watchlist not found.', 404);
            }

            $this->watchlistService->delete($id);

            return $this->sendResponse(null, 'Watchlist deleted successfully.');
        } catch (Exception $e) {
            return $this->sendError('Failed to delete watchlist.', 500);
        }
    }

    /**
     * Add a security to a watchlist.
     */
    public function addSecurity(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'security_id'       => 'required|integer|exists:securities,id',
            'alert_price_above' => 'nullable|numeric|min:0',
            'alert_price_below' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            /** @var Watchlist|null $watchlist */
            $watchlist = $this->watchlistService->getById($id);

            if (!$watchlist || $watchlist->user_id !== auth()->id()) {
                return $this->sendError('Watchlist not found.', 404);
            }

            $item = $this->watchlistService->addSymbol(
                $id,
                (int) $request->input('security_id'),
                $request->input('alert_price_above'),
                $request->input('alert_price_below')
            );

            return $this->sendResponse(
                $item,
                'Security added to watchlist successfully.',
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
     * Remove a security from a watchlist.
     */
    public function removeSecurity(int $id, int $securityId): JsonResponse
    {
        try {
            /** @var Watchlist|null $watchlist */
            $watchlist = $this->watchlistService->getById($id);

            if (!$watchlist || $watchlist->user_id !== auth()->id()) {
                return $this->sendError('Watchlist not found.', 404);
            }

            $this->watchlistService->removeSymbol($id, $securityId);

            return $this->sendResponse(null, 'Security removed from watchlist successfully.');
        } catch (Exception $e) {
            return $this->sendError('Failed to remove security.', 500);
        }
    }

    /**
     * Update alert settings for a watchlist item.
     */
    public function updateAlert(Request $request, int $itemId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'alert_price_above' => 'nullable|numeric|min:0',
            'alert_price_below' => 'nullable|numeric|min:0',
            'alert_enabled'     => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $item = $this->watchlistService->getItemById($itemId);

            if (!$item || $item->watchlist->user_id !== auth()->id()) {
                return $this->sendError('Watchlist item not found.', 404);
            }

            $updated = $this->watchlistService->updateAlert($itemId, $validator->validated());

            return $this->sendResponse(
                $updated,
                'Alert updated successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError('Failed to update alert.', 500);
        }
    }

    /**
     * Get all enabled alerts for the authenticated user.
     */
    public function alerts(): JsonResponse
    {
        try {
            $alerts = $this->watchlistService->getUserAlerts(auth()->id());

            return $this->sendResponse(
                $alerts,
                'Alerts retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError('Failed to retrieve alerts.', 500);
        }
    }
}
