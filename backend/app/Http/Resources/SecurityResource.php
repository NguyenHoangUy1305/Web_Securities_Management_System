<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Security;
use Illuminate\Http\Request;

class SecurityResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Security $security */
        $security = $this->resource;

        return [
            'id'             => $security->id,
            'symbol'         => $security->symbol,
            'name'           => $security->name,
            'exchange'       => $security->exchange,
            'type'           => $security->type,
            'sector'         => $security->sector,
            'industry'       => $security->industry,
            'market_cap'     => $security->market_cap,
            'current_price'  => $security->current_price,
            'eps'            => $security->eps,
            'pe_ratio'       => $security->pe_ratio,
            'dividend_yield' => $security->dividend_yield,
            'volume'         => $security->volume,
            'day_high'       => $security->day_high,
            'day_low'        => $security->day_low,
            'year_high'      => $security->year_high,
            'year_low'       => $security->year_low,
            'is_active'      => $security->is_active,
            'created_at'     => $security->created_at?->toISOString(),
            'updated_at'     => $security->updated_at?->toISOString(),
        ];
    }
}
