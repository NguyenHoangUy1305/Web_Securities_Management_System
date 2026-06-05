<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Watchlist;
use Illuminate\Http\Request;

class WatchlistResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Watchlist $watchlist */
        $watchlist = $this->resource;

        return [
            'id'         => $watchlist->id,
            'user_id'    => $watchlist->user_id,
            'name'       => $watchlist->name,
            'items'      => WatchlistItemResource::collection($watchlist->whenLoaded('items')),
            'created_at' => $watchlist->created_at?->toISOString(),
            'updated_at' => $watchlist->updated_at?->toISOString(),
        ];
    }
}
