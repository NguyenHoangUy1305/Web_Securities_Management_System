<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Notifications\PriceAlertNotification;
use App\Services\WatchlistService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckPriceAlertJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(WatchlistService $watchlistService): void
    {
        $triggeredItems = $watchlistService->checkPriceAlerts();

        foreach ($triggeredItems as $item) {
            $user     = $item->watchlist->user;
            $security = $item->security;

            $user->notify(new PriceAlertNotification($item, $security));
        }
    }
}
