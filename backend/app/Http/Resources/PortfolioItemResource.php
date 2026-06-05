<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PortfolioItem;
use Illuminate\Http\Request;

class PortfolioItemResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var PortfolioItem $item */
        $item = $this->resource;

        return [
            'id'                  => $item->id,
            'portfolio_id'        => $item->portfolio_id,
            'security_id'         => $item->security_id,
            'security'            => new SecurityResource($item->whenLoaded('security')),
            'quantity'            => (float) $item->quantity,
            'avg_buy_price'       => (float) $item->avg_buy_price,
            'current_value'       => $item->current_value,
            'profit_loss'         => $item->profit_loss,
            'profit_loss_percent' => $item->profit_loss_percent,
        ];
    }
}
