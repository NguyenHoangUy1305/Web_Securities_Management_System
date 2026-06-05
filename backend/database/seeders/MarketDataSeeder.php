<?php

namespace Database\Seeders;

use App\Models\MarketData;
use App\Models\Security;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class MarketDataSeeder extends Seeder
{
    public function run(): void
    {
        $securities = Security::where('type', 'stock')->take(10)->get();
        $count = 0;

        foreach ($securities as $security) {
            $basePrice = $security->current_price ?? 50000;
            $now = Carbon::now();

            for ($i = 90; $i >= 0; $i--) {
                $day = $now->copy()->subDays($i);
                if ($day->isWeekend()) continue;

                $volatility = $basePrice * 0.02;
                $open = $basePrice + (mt_rand(-100, 100) / 100) * $volatility;
                $close = $open + (mt_rand(-80, 80) / 100) * $volatility;
                $high = max($open, $close) + (mt_rand(0, 50) / 100) * $volatility;
                $low = min($open, $close) - (mt_rand(0, 50) / 100) * $volatility;
                $volume = mt_rand(500000, 5000000);

                MarketData::create([
                    'security_id' => $security->id,
                    'timestamp' => $day->setTime(9, 15, 0),
                    'open' => round($open),
                    'high' => round($high),
                    'low' => round($low),
                    'close' => round($close),
                    'volume' => $volume,
                ]);
                $count++;
            }
        }

        $this->command->info("Created $count market data records");
    }
}
