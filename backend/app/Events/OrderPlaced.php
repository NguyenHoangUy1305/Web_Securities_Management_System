<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderPlaced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The order instance.
     */
    public Order $order;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to a private channel for the user who placed the order
        // and a public channel for the security's order book.
        return [
            new Channel('orders.user.' . $this->order->user_id),
            new Channel('orders.security.' . $this->order->security_id),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id'           => $this->order->id,
            'user_id'      => $this->order->user_id,
            'portfolio_id' => $this->order->portfolio_id,
            'security_id'  => $this->order->security_id,
            'type'         => $this->order->type->value,
            'order_type'   => $this->order->order_type->value,
            'quantity'     => (float) $this->order->quantity,
            'price'        => $this->order->price !== null ? (float) $this->order->price : null,
            'total_amount' => $this->order->total_amount !== null ? (float) $this->order->total_amount : null,
            'status'       => $this->order->status->value,
            'created_at'   => $this->order->created_at?->toISOString(),
        ];
    }
}
