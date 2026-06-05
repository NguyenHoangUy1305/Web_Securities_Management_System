<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\MarketData;
use Illuminate\Http\Request;

class MarketDataResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var MarketData $marketData */
        $marketData = $this->resource;

        return [
            'id'          => $marketData->id,
            'security_id' => $marketData->security_id,
            'timestamp'   => $marketData->timestamp?->toISOString(),
            'open'        => $marketData->open,
            'high'        => $marketData->high,
            'low'         => $marketData->low,
            'close'       => $marketData->close,
            'volume'      => $marketData->volume,
            'created_at'  => $marketData->created_at?->toISOString(),
            'updated_at'  => $marketData->updated_at?->toISOString(),
        ];
    }
}
