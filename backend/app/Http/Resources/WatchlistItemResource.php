<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\WatchlistItem;
use Illuminate\Http\Request;

class WatchlistItemResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var WatchlistItem $item */
        $item = $this->resource;

        return [
            'id'                => $item->id,
            'watchlist_id'      => $item->watchlist_id,
            'security_id'       => $item->security_id,
            'security'          => new SecurityResource($item->whenLoaded('security')),
            'alert_price_above' => $item->alert_price_above !== null ? (float) $item->alert_price_above : null,
            'alert_price_below' => $item->alert_price_below !== null ? (float) $item->alert_price_below : null,
            'alert_enabled'     => $item->alert_enabled,
            'created_at'        => $item->created_at?->toISOString(),
            'updated_at'        => $item->updated_at?->toISOString(),
        ];
    }
}
