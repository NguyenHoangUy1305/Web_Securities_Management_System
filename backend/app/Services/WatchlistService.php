<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Watchlist;
use App\Models\WatchlistItem;
use App\Repositories\WatchlistRepository;
use Illuminate\Database\Eloquent\Collection;

class WatchlistService extends BaseService
{
    protected WatchlistRepository $watchlistRepository;

    public function __construct(WatchlistRepository $watchlistRepository)
    {
        parent::__construct($watchlistRepository);
        $this->watchlistRepository = $watchlistRepository;
    }

    /**
     * Get all watchlists for a user, with items and securities loaded.
     *
     * @return Collection<int, Watchlist>
     */
    public function getWatchlists(int $userId): Collection
    {
        return $this->watchlistRepository
            ->findWhere('user_id', '=', $userId)
            ->load('items.security');
    }

    /**
     * Create a new watchlist for a user.
     */
    public function createWatchlist(int $userId, string $name): Watchlist
    {
        /** @var Watchlist */
        return $this->watchlistRepository->create([
            'user_id' => $userId,
            'name'    => $name,
        ]);
    }

    /**
     * Add a security to a watchlist with optional alert prices.
     */
    public function addSymbol(
        int $watchlistId,
        int $securityId,
        ?float $alertPriceAbove = null,
        ?float $alertPriceBelow = null
    ): WatchlistItem {
        return WatchlistItem::create([
            'watchlist_id'      => $watchlistId,
            'security_id'       => $securityId,
            'alert_price_above' => $alertPriceAbove,
            'alert_price_below' => $alertPriceBelow,
            'alert_enabled'     => $alertPriceAbove !== null || $alertPriceBelow !== null,
        ]);
    }

    /**
     * Remove a security from a watchlist.
     */
    public function removeSymbol(int $watchlistId, int $securityId): bool
    {
        return WatchlistItem::where('watchlist_id', $watchlistId)
            ->where('security_id', $securityId)
            ->delete() > 0;
    }

    /**
     * Update alert settings for a watchlist item.
     */
    public function updateAlert(int $itemId, array $data): ?WatchlistItem
    {
        $item = WatchlistItem::find($itemId);

        if ($item === null) {
            return null;
        }

        $item->update($data);

        return $item->fresh();
    }

    /**
     * Get a watchlist item by ID with its watchlist relation loaded.
     */
    public function getItemById(int $itemId): ?WatchlistItem
    {
        return WatchlistItem::with('watchlist')->find($itemId);
    }

    /**
     * Get all enabled alerts for a given user.
     *
     * @return Collection<int, WatchlistItem>
     */
    public function getUserAlerts(int $userId): Collection
    {
        return WatchlistItem::whereHas('watchlist', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->withAlertsEnabled()
            ->with(['watchlist', 'security'])
            ->get();
    }

    /**
     * Check all enabled price alerts and return only those that have been triggered.
     *
     * @return Collection<int, WatchlistItem>
     */
    public function checkPriceAlerts(): Collection
    {
        $items = WatchlistItem::withAlertsEnabled()
            ->with(['watchlist.user', 'security'])
            ->get();

        return $items->filter(function (WatchlistItem $item) {
            $price = $item->security->current_price;

            if ($price === null) {
                return false;
            }

            if ($item->alert_price_above !== null && (float) $price >= (float) $item->alert_price_above) {
                return true;
            }

            if ($item->alert_price_below !== null && (float) $price <= (float) $item->alert_price_below) {
                return true;
            }

            return false;
        });
    }
}
