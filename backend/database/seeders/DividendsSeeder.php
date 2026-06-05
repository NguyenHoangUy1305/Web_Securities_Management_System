<?php

namespace Database\Seeders;

use App\Models\Dividend;
use App\Models\Security;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DividendsSeeder extends Seeder
{
    public function run(): void
    {
        $securities = Security::whereIn('symbol', ['VCB', 'VNM', 'FPT', 'HPG', 'MSN', 'MWG', 'TCB', 'PNJ', 'GAS', 'SAB', 'VIC', 'MBB'])->get();

        $dividends = [
            ['VCB' => ['amount' => 3500, 'ex_date' => '-30 days', 'payment' => '-15 days']],
            ['VNM' => ['amount' => 3500, 'ex_date' => '-60 days', 'payment' => '-30 days']],
            ['FPT' => ['amount' => 2000, 'ex_date' => '-45 days', 'payment' => '-20 days']],
            ['HPG' => ['amount' => 1500, 'ex_date' => '-90 days', 'payment' => '-60 days']],
            ['MSN' => ['amount' => 1000, 'ex_date' => '-120 days', 'payment' => '-90 days']],
            ['MWG' => ['amount' => 500, 'ex_date' => '-50 days', 'payment' => '-30 days']],
            ['TCB' => ['amount' => 2000, 'ex_date' => '-40 days', 'payment' => '-20 days']],
            ['PNJ' => ['amount' => 2500, 'ex_date' => '-70 days', 'payment' => '-45 days']],
            ['GAS' => ['amount' => 3000, 'ex_date' => '-35 days', 'payment' => '-15 days']],
            ['SAB' => ['amount' => 5000, 'ex_date' => '-80 days', 'payment' => '-50 days']],
            ['VIC' => ['amount' => 0, 'ex_date' => null, 'payment' => null]], // no dividend
            ['MBB' => ['amount' => 1500, 'ex_date' => '-55 days', 'payment' => '-25 days']],
        ];

        $count = 0;
        foreach ($dividends as $item) {
            $symbol = array_key_first($item);
            $data = $item[$symbol];
            if ($data['amount'] <= 0) continue;

            $security = $securities->firstWhere('symbol', $symbol);
            if (!$security) continue;

            Dividend::create([
                'security_id' => $security->id,
                'ex_date' => Carbon::now()->addDays(random_int(-90, -1)),
                'payment_date' => Carbon::now()->addDays(random_int(1, 60)),
                'record_date' => Carbon::now()->addDays(random_int(-85, 5)),
                'amount_per_share' => $data['amount'],
                'currency' => 'VND',
                'dividend_type' => 'cash',
            ]);
            $count++;
        }

        $this->command->info("Created $count dividend records");
    }
}
