<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderFilled implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The order instance.
     */
    public Order $order;

    /**
     * Transaction data associated with the fill.
     *
     * @var array<string, mixed>
     */
    public array $transaction;

    /**
     * Create a new event instance.
     *
     * @param array<string, mixed> $transaction
     */
    public function __construct(Order $order, array $transaction)
    {
        $this->order = $order;
        $this->transaction = $transaction;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
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
            'order' => [
                'id'              => $this->order->id,
                'user_id'         => $this->order->user_id,
                'portfolio_id'    => $this->order->portfolio_id,
                'security_id'     => $this->order->security_id,
                'type'            => $this->order->type->value,
                'order_type'      => $this->order->order_type->value,
                'quantity'        => (float) $this->order->quantity,
                'price'           => $this->order->price !== null ? (float) $this->order->price : null,
                'total_amount'    => $this->order->total_amount !== null ? (float) $this->order->total_amount : null,
                'status'          => $this->order->status->value,
                'filled_quantity' => $this->order->filled_quantity !== null ? (float) $this->order->filled_quantity : null,
                'filled_price'    => $this->order->filled_price !== null ? (float) $this->order->filled_price : null,
            ],
            'transaction' => $this->transaction,
        ];
    }
}
