<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Order $order */
        $order = $this->resource;

        return [
            'id'              => $order->id,
            'user_id'         => $order->user_id,
            'portfolio_id'    => $order->portfolio_id,
            'security_id'     => $order->security_id,
            'type'            => $order->type->value,
            'order_type'      => $order->order_type->value,
            'quantity'        => (float) $order->quantity,
            'price'           => $order->price !== null ? (float) $order->price : null,
            'total_amount'    => $order->total_amount !== null ? (float) $order->total_amount : null,
            'status'          => $order->status->value,
            'filled_quantity' => $order->filled_quantity !== null ? (float) $order->filled_quantity : null,
            'filled_price'    => $order->filled_price !== null ? (float) $order->filled_price : null,
            'expires_at'      => $order->expires_at?->toISOString(),
            'created_at'      => $order->created_at?->toISOString(),
            'updated_at'      => $order->updated_at?->toISOString(),
            'security'        => new SecurityResource($order->whenLoaded('security')),
            'portfolio'       => new PortfolioResource($order->whenLoaded('portfolio')),
        ];
    }
}
