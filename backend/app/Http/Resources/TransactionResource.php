<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionResource extends BaseResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Transaction $transaction */
        $transaction = $this->resource;

        return [
            'id'           => $transaction->id,
            'user_id'      => $transaction->user_id,
            'portfolio_id' => $transaction->portfolio_id,
            'security_id'  => $transaction->security_id,
            'order_id'     => $transaction->order_id,
            'type'         => $transaction->type instanceof \App\Enums\TransactionType
                ? $transaction->type->value
                : $transaction->type,
            'quantity'     => $transaction->quantity !== null ? (float) $transaction->quantity : null,
            'price'        => $transaction->price !== null ? (float) $transaction->price : null,
            'total_amount' => (float) $transaction->total_amount,
            'fee'          => (float) $transaction->fee,
            'tax'          => (float) $transaction->tax,
            'net_amount'   => (float) $transaction->net_amount,
            'executed_at'  => $transaction->executed_at?->toISOString(),
            'notes'        => $transaction->notes,
            'created_at'   => $transaction->created_at?->toISOString(),
            'updated_at'   => $transaction->updated_at?->toISOString(),
            'security'     => new SecurityResource($transaction->whenLoaded('security')),
            'portfolio'    => new PortfolioResource($transaction->whenLoaded('portfolio')),
            'order'        => new OrderResource($transaction->whenLoaded('order')),
        ];
    }
}
