<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Portfolio;
use Illuminate\Http\Request;

class PortfolioResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Portfolio $portfolio */
        $portfolio = $this->resource;

        return [
            'id'           => $portfolio->id,
            'user_id'      => $portfolio->user_id,
            'name'         => $portfolio->name,
            'description'  => $portfolio->description,
            'total_value'  => $portfolio->total_value !== null ? (float) $portfolio->total_value : null,
            'cash_balance' => $portfolio->cash_balance !== null ? (float) $portfolio->cash_balance : null,
            'items'        => PortfolioItemResource::collection($portfolio->whenLoaded('items')),
            'created_at'   => $portfolio->created_at?->toISOString(),
            'updated_at'   => $portfolio->updated_at?->toISOString(),
        ];
    }
}
