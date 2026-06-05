<?php

declare(strict_types=1);

namespace App\DTOs\Order;

use App\DTOs\BaseDTO;

class OrderDTO extends BaseDTO
{
    public ?int $id = null;

    public int $user_id;

    public int $portfolio_id;

    public int $security_id;

    public string $type;

    public string $order_type;

    public float $quantity;

    public ?float $price = null;

    public ?float $total_amount = null;

    public string $status = 'pending';

    public ?float $filled_quantity = null;

    public ?float $filled_price = null;

    public ?string $expires_at = null;

    /**
     * Convert the DTO to an associative array.
     */
    public function toArray(): array
    {
        return [
            'user_id'         => $this->user_id,
            'portfolio_id'    => $this->portfolio_id,
            'security_id'     => $this->security_id,
            'type'            => $this->type,
            'order_type'      => $this->order_type,
            'quantity'        => $this->quantity,
            'price'           => $this->price,
            'total_amount'    => $this->total_amount,
            'status'          => $this->status,
            'filled_quantity' => $this->filled_quantity,
            'filled_price'    => $this->filled_price,
            'expires_at'      => $this->expires_at,
        ];
    }

    /**
     * Create a DTO from an Order model instance.
     */
    public static function fromModel(\App\Models\Order $order): self
    {
        $dto = new self();

        $dto->id             = $order->id;
        $dto->user_id        = $order->user_id;
        $dto->portfolio_id   = $order->portfolio_id;
        $dto->security_id    = $order->security_id;
        $dto->type           = $order->type->value;
        $dto->order_type     = $order->order_type->value;
        $dto->quantity       = (float) $order->quantity;
        $dto->price          = $order->price !== null ? (float) $order->price : null;
        $dto->total_amount   = $order->total_amount !== null ? (float) $order->total_amount : null;
        $dto->status         = $order->status->value;
        $dto->filled_quantity = $order->filled_quantity !== null ? (float) $order->filled_quantity : null;
        $dto->filled_price   = $order->filled_price !== null ? (float) $order->filled_price : null;
        $dto->expires_at     = $order->expires_at?->toISOString();

        return $dto;
    }
}
