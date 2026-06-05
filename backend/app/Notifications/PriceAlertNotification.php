<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Security;
use App\Models\WatchlistItem;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PriceAlertNotification extends Notification
{
    use Queueable;

    public WatchlistItem $watchlistItem;

    public Security $security;

    /**
     * Create a new notification instance.
     */
    public function __construct(WatchlistItem $watchlistItem, Security $security)
    {
        $this->watchlistItem = $watchlistItem;
        $this->security      = $security;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $price = $this->security->current_price;
        $above = $this->watchlistItem->alert_price_above;
        $below = $this->watchlistItem->alert_price_below;

        $message = sprintf(
            '%s is now at $%s.',
            $this->security->symbol,
            $price
        );

        if ($above !== null && (float) $price >= (float) $above) {
            $message .= sprintf(' It has exceeded your alert of $%s.', $above);
        } elseif ($below !== null && (float) $price <= (float) $below) {
            $message .= sprintf(' It has dropped below your alert of $%s.', $below);
        }

        return [
            'watchlist_item_id' => $this->watchlistItem->id,
            'watchlist_id'      => $this->watchlistItem->watchlist_id,
            'security_id'       => $this->security->id,
            'symbol'            => $this->security->symbol,
            'security_name'     => $this->security->name,
            'current_price'     => $price !== null ? (float) $price : null,
            'alert_price_above' => $above !== null ? (float) $above : null,
            'alert_price_below' => $below !== null ? (float) $below : null,
            'message'           => $message,
        ];
    }
}
