<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Security;
use App\Models\Portfolio;
use App\Models\PortfolioItem;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\MarketData;
use App\Models\Dividend;
use App\Enums\OrderSide;
use App\Enums\OrderType;
use App\Enums\OrderStatus;
use App\Enums\TransactionType;
use App\Enums\DividendType;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class MassDataSeeder extends Seeder
{
    /**
     * Seed the database with a large volume of realistic test data.
     */
    public function run(): void
    {
        $this->command->info('=== Mass Data Seeder: Generating Large Volume of Test Data ===');
        $this->command->info('');

        // ────────────────────────────────────────────────────────────────
        // SECTION 1: Users (20 total: 3 admins, 3 brokers, 14 investors)
        // ────────────────────────────────────────────────────────────────
        $allUsers = [];
        try {
            $this->command->info('[1/7] Creating users...');

            // Admins
            $adminData = [
                ['name' => 'Admin System',     'email' => 'admin@securities.com',       'phone' => '0901000001'],
                ['name' => 'Super Admin',       'email' => 'superadmin@securities.com',  'phone' => '0901000011'],
                ['name' => 'Quan Tri Vien',     'email' => 'quantrivien@securities.com', 'phone' => '0901000012'],
            ];

            foreach ($adminData as $data) {
                $user = User::firstOrCreate(
                    ['email' => $data['email']],
                    [
                        'name'     => $data['name'],
                        'password' => 'password123',
                        'phone'    => $data['phone'],
                        'status'   => 'active',
                    ]
                );
                if (!$user->hasRole('admin')) {
                    $user->assignRole('admin');
                }
                $allUsers['admin'][] = $user;
            }

            // Brokers
            $brokerData = [
                ['name' => 'Broker Nguyen', 'email' => 'broker@securities.com',      'phone' => '0901000002'],
                ['name' => 'Broker Tran',   'email' => 'brokertran@securities.com',  'phone' => '0901000013'],
                ['name' => 'Broker Le',     'email' => 'brokerle@securities.com',    'phone' => '0901000014'],
            ];

            foreach ($brokerData as $data) {
                $user = User::firstOrCreate(
                    ['email' => $data['email']],
                    [
                        'name'     => $data['name'],
                        'password' => 'password123',
                        'phone'    => $data['phone'],
                        'status'   => 'active',
                    ]
                );
                if (!$user->hasRole('broker')) {
                    $user->assignRole('broker');
                }
                $allUsers['broker'][] = $user;
            }

            // Investors (14 Vietnamese names)
            $investorData = [
                ['name' => 'Nguyen Van An',     'email' => 'nguyenvana@securities.com',    'phone' => '0901000101'],
                ['name' => 'Tran Thi Binh',     'email' => 'tranthibinh@securities.com',   'phone' => '0901000102'],
                ['name' => 'Le Van Cuong',      'email' => 'levancuong@securities.com',    'phone' => '0901000103'],
                ['name' => 'Pham Thi Dung',     'email' => 'phamthidung@securities.com',   'phone' => '0901000104'],
                ['name' => 'Hoang Van Em',      'email' => 'hoangvanem@securities.com',    'phone' => '0901000105'],
                ['name' => 'Ngo Van Phuong',    'email' => 'ngovanphuong@securities.com',  'phone' => '0901000106'],
                ['name' => 'Dang Thi Gam',      'email' => 'dangthigam@securities.com',    'phone' => '0901000107'],
                ['name' => 'Vu Van Huy',        'email' => 'vuvanhuyd@securities.com',     'phone' => '0901000108'],
                ['name' => 'Bui Thi Hien',      'email' => 'buithihien@securities.com',    'phone' => '0901000109'],
                ['name' => 'Do Van Khanh',      'email' => 'dovankhanh@securities.com',    'phone' => '0901000110'],
                ['name' => 'Le Thi Lan',        'email' => 'lethilan@securities.com',      'phone' => '0901000111'],
                ['name' => 'Trinh Van Manh',    'email' => 'trinhvanmanh@securities.com',  'phone' => '0901000112'],
                ['name' => 'Phan Thi Ngoc',     'email' => 'phanthingoc@securities.com',   'phone' => '0901000113'],
                ['name' => 'Mai Van Phuc',      'email' => 'maivanphuc@securities.com',    'phone' => '0901000114'],
            ];

            foreach ($investorData as $data) {
                $user = User::firstOrCreate(
                    ['email' => $data['email']],
                    [
                        'name'     => $data['name'],
                        'password' => 'password123',
                        'phone'    => $data['phone'],
                        'status'   => 'active',
                    ]
                );
                if (!$user->hasRole('investor')) {
                    $user->assignRole('investor');
                }
                $allUsers['investor'][] = $user;
            }

            $this->command->info('  Created/verified ' . count($adminData) . ' admins, ' . count($brokerData) . ' brokers, ' . count($investorData) . ' investors');
        } catch (\Exception $e) {
            $this->command->error('  User creation error: ' . $e->getMessage());
        }

        // ────────────────────────────────────────────────────────────────
        // SECTION 2: Portfolios (12 total: 10 for investors + 1 broker + 1 admin)
        // ────────────────────────────────────────────────────────────────
        $portfolios = [];
        $portfolioUsers = [];
        try {
            $this->command->info('[2/7] Creating portfolios...');

            $investors = $allUsers['investor'] ?? [];
            $portfolioDefs = [
                ['name' => 'Đầu tư dài hạn', 'description' => 'Danh mục đầu tư dài hạn, tập trung vào cổ phiếu bluechip và trái phiếu', 'cash_balance' => 200000000],
                ['name' => 'Tăng trưởng',    'description' => 'Danh mục tăng trưởng, ưu tiên cổ phiếu có tiềm năng tăng giá cao', 'cash_balance' => 150000000],
                ['name' => 'Cổ tức',         'description' => 'Danh mục cổ tức, tập trung vào cổ phiếu trả cổ tức cao', 'cash_balance' => 100000000],
                ['name' => 'Lướt sóng',      'description' => 'Danh mục lướt sóng ngắn hạn, giao dịch theo xu hướng thị trường', 'cash_balance' => 80000000],
                ['name' => 'Cân bằng',       'description' => 'Danh mục cân bằng giữa tăng trưởng và an toàn', 'cash_balance' => 120000000],
                ['name' => 'An toàn',        'description' => 'Danh mục an toàn, ưu tiên trái phiếu và cổ phiếu defensive', 'cash_balance' => 250000000],
                ['name' => 'Đầu cơ',         'description' => 'Danh mục đầu cơ mạo hiểm, tập trung cổ phiếu mid-cap và penny', 'cash_balance' => 50000000],
                ['name' => 'ETF',            'description' => 'Danh mục đầu tư qua ETF, đa dạng hóa theo chỉ số', 'cash_balance' => 90000000],
                ['name' => 'Bluechip',       'description' => 'Danh mục bluechip hàng đầu sàn HOSE', 'cash_balance' => 300000000],
                ['name' => 'Mạo hiểm',       'description' => 'Danh mục mạo hiểm tỷ suất sinh lời cao - rủi ro cao', 'cash_balance' => 60000000],
            ];

            $portfolioCount = 0;
            foreach ($portfolioDefs as $i => $def) {
                $investor = $investors[$i % count($investors)] ?? null;
                if (!$investor) {
                    continue;
                }

                $portfolio = Portfolio::create([
                    'user_id'      => $investor->id,
                    'name'         => $def['name'],
                    'description'  => $def['description'],
                    'total_value'  => $def['cash_balance'],
                    'cash_balance' => $def['cash_balance'],
                ]);

                $portfolios[] = $portfolio;
                $portfolioUsers[$portfolio->id] = $investor->id;
                $portfolioCount++;
            }

            // Create 1 extra portfolio for a broker
            if (!empty($allUsers['broker'])) {
                $brokerPortfolio = Portfolio::create([
                    'user_id'      => $allUsers['broker'][0]->id,
                    'name'         => 'Broker Management',
                    'description'  => 'Danh mục quản lý của broker',
                    'total_value'  => 500000000,
                    'cash_balance' => 500000000,
                ]);
                $portfolios[] = $brokerPortfolio;
                $portfolioUsers[$brokerPortfolio->id] = $allUsers['broker'][0]->id;
                $portfolioCount++;
            }

            // Create 1 extra portfolio for an admin
            if (!empty($allUsers['admin'])) {
                $adminPortfolio = Portfolio::create([
                    'user_id'      => $allUsers['admin'][0]->id,
                    'name'         => 'Admin Test',
                    'description'  => 'Danh mục thử nghiệm của admin',
                    'total_value'  => 1000000000,
                    'cash_balance' => 1000000000,
                ]);
                $portfolios[] = $adminPortfolio;
                $portfolioUsers[$adminPortfolio->id] = $allUsers['admin'][0]->id;
                $portfolioCount++;
            }

            $this->command->info("  Created $portfolioCount portfolios");
        } catch (\Exception $e) {
            $this->command->error('  Portfolio creation error: ' . $e->getMessage());
        }

        // ────────────────────────────────────────────────────────────────
        // SECTION 3: Portfolio Items (3-8 items per portfolio)
        // ────────────────────────────────────────────────────────────────
        $portfolioItemCount = 0;
        try {
            $this->command->info('[3/7] Creating portfolio items...');

            $securities = Security::all();
            if ($securities->isEmpty()) {
                throw new \RuntimeException('No securities found. Run SecuritiesSeeder first.');
            }

            foreach ($portfolios as $portfolio) {
                $numItems = random_int(3, 8);
                $usedSecurityIds = [];
                $totalHoldingsValue = 0;

                for ($j = 0; $j < $numItems; $j++) {
                    $security = $securities->random();
                    // Avoid duplicate securities in the same portfolio
                    if (in_array($security->id, $usedSecurityIds)) {
                        $security = $securities->whereNotIn('id', $usedSecurityIds)->random();
                    }
                    $usedSecurityIds[] = $security->id;

                    $quantity = random_int(100, 10000);
                    $currentPrice = (float) $security->current_price;
                    // avg_buy_price slightly different from current_price for realistic P&L
                    $priceVariation = $currentPrice * (random_int(-500, 500) / 10000); // -5% to +5%
                    $avgBuyPrice = max(100, $currentPrice + $priceVariation);

                    PortfolioItem::create([
                        'portfolio_id'  => $portfolio->id,
                        'security_id'   => $security->id,
                        'quantity'      => $quantity,
                        'avg_buy_price' => round($avgBuyPrice, 2),
                    ]);

                    $portfolioItemCount++;
                    $totalHoldingsValue += $quantity * $currentPrice;
                }

                // Update portfolio total_value to include holdings + cash
                $portfolio->total_value = $totalHoldingsValue + (float) $portfolio->cash_balance;
                $portfolio->save();
            }

            $this->command->info("  Created $portfolioItemCount portfolio items");
        } catch (\Exception $e) {
            $this->command->error('  Portfolio items creation error: ' . $e->getMessage());
        }

        // ────────────────────────────────────────────────────────────────
        // SECTION 4: Orders (55+ spread across users)
        // ────────────────────────────────────────────────────────────────
        $createdOrders = [];
        $filledOrders = [];
        try {
            $this->command->info('[4/7] Creating orders...');

            $securities = Security::all();
            if ($securities->isEmpty()) {
                throw new \RuntimeException('No securities found.');
            }

            // Collect all users with their respective portfolio_id for order creation
            $userPortfolioMap = [];
            foreach ($portfolios as $portfolio) {
                $userId = $portfolioUsers[$portfolio->id] ?? null;
                if ($userId && !isset($userPortfolioMap[$userId])) {
                    $userPortfolioMap[$userId] = [];
                }
                if ($userId) {
                    $userPortfolioMap[$userId][] = $portfolio->id;
                }
            }

            // Gather all users with their portfolio
            $allUsersFlat = array_merge(
                $allUsers['admin'] ?? [],
                $allUsers['broker'] ?? [],
                $allUsers['investor'] ?? []
            );

            $orderStatuses = ['filled', 'pending', 'cancelled', 'open', 'partial', 'rejected'];
            $orderStatusWeights = [40, 20, 15, 10, 10, 5]; // 40% filled, etc.
            $totalWeight = array_sum($orderStatusWeights);

            $orderCount = 0;
            $targetOrders = 55;

            for ($i = 0; $i < $targetOrders; $i++) {
                $user = $allUsersFlat[array_rand($allUsersFlat)];
                $userPortfolios = $userPortfolioMap[$user->id] ?? null;

                if (empty($userPortfolios)) {
                    continue;
                }

                $portfolioId = $userPortfolios[array_rand($userPortfolios)];
                $security = $securities->random();
                $currentPrice = (float) $security->current_price;

                // Pick a random status based on weights
                $rand = random_int(1, $totalWeight);
                $cumulative = 0;
                $statusIndex = 0;
                foreach ($orderStatusWeights as $idx => $weight) {
                    $cumulative += $weight;
                    if ($rand <= $cumulative) {
                        $statusIndex = $idx;
                        break;
                    }
                }
                $status = $orderStatuses[$statusIndex];

                $isBuy = random_int(0, 1) === 0;
                $isMarket = random_int(0, 1) === 0;

                $quantity = random_int(100, 5000);
                $price = $isMarket ? null : round($currentPrice * (1 + random_int(-300, 300) / 10000), 2);

                $orderDate = Carbon::now()->subDays(random_int(0, 30))->setTime(
                    random_int(9, 14),
                    random_int(0, 59),
                    random_int(0, 59)
                );

                $filledQty = 0;
                $filledPrice = null;

                if (in_array($status, ['filled', 'partial'])) {
                    $filledQty = ($status === 'filled') ? $quantity : random_int((int) ($quantity * 0.3), (int) ($quantity * 0.9));
                    $filledPrice = $price ?? round($currentPrice * (1 + random_int(-200, 200) / 10000), 2);
                }

                $totalAmount = $price ? round($quantity * $price, 2) : round($quantity * $currentPrice, 2);

                $order = Order::create([
                    'user_id'         => $user->id,
                    'portfolio_id'    => $portfolioId,
                    'security_id'     => $security->id,
                    'type'            => $isBuy ? OrderSide::Buy : OrderSide::Sell,
                    'order_type'      => $isMarket ? OrderType::Market : OrderType::Limit,
                    'quantity'        => $quantity,
                    'price'           => $price,
                    'total_amount'    => $totalAmount,
                    'status'          => $status,
                    'filled_quantity' => $filledQty,
                    'filled_price'    => $filledPrice,
                    'expires_at'      => ($status === 'pending' || $status === 'open')
                        ? Carbon::now()->addDays(random_int(1, 30))
                        : null,
                    'created_at'      => $orderDate,
                    'updated_at'      => $orderDate,
                ]);

                $createdOrders[] = $order;
                if ($status === 'filled' || $status === 'partial') {
                    $filledOrders[] = $order;
                }
                $orderCount++;
            }

            $this->command->info("  Created $orderCount orders (" . count($filledOrders) . " filled/partial)");
        } catch (\Exception $e) {
            $this->command->error('  Order creation error: ' . $e->getMessage());
        }

        // ────────────────────────────────────────────────────────────────
        // SECTION 5: Transactions (80+ linked to filled orders + cash mgmt)
        // ────────────────────────────────────────────────────────────────
        try {
            $this->command->info('[5/7] Creating transactions...');

            $transactionCount = 0;

            // 5a. Transactions for filled orders
            foreach ($filledOrders as $order) {
                $executedAt = $order->created_at ? $order->created_at->addMinutes(random_int(1, 60)) : Carbon::now()->subDays(random_int(0, 30));

                $isBuy = $order->type === OrderSide::Buy || $order->type === 'buy';
                $txType = $isBuy ? TransactionType::Buy : TransactionType::Sell;
                $qty = (float) ($order->filled_quantity ?: $order->quantity);
                $px = (float) ($order->filled_price ?: ($order->price ?: 10000));
                $totalAmount = round($qty * $px, 2);
                $fee = round($totalAmount * 0.0015, 2); // 0.15% brokerage fee
                $tax = $isBuy ? 0 : round($totalAmount * 0.001, 2); // 0.1% sell tax
                $netAmount = $isBuy
                    ? round($totalAmount + $fee, 2)
                    : round($totalAmount - $fee - $tax, 2);

                $notes = $isBuy
                    ? 'Mua ' . number_format($qty) . ' cp ' . ($order->security->symbol ?? '')
                    : 'Bán ' . number_format($qty) . ' cp ' . ($order->security->symbol ?? '');

                Transaction::create([
                    'user_id'      => $order->user_id,
                    'portfolio_id' => $order->portfolio_id,
                    'security_id'  => $order->security_id,
                    'order_id'     => $order->id,
                    'type'         => $txType,
                    'quantity'     => $qty,
                    'price'        => $px,
                    'total_amount' => $totalAmount,
                    'fee'          => $fee,
                    'tax'          => $tax,
                    'net_amount'   => $netAmount,
                    'executed_at'  => $executedAt,
                    'notes'        => $notes,
                    'created_at'   => $executedAt,
                    'updated_at'   => $executedAt,
                ]);

                $transactionCount++;
            }

            // 5b. Additional deposit transactions for cash management
            $allPortfolios = $portfolios;
            for ($i = 0; $i < 15; $i++) {
                $portfolio = $allPortfolios[array_rand($allPortfolios)];
                $userId = $portfolioUsers[$portfolio->id] ?? $portfolio->user_id;
                $depositAmount = round(random_int(1000000, 100000000) / 1000) * 1000; // Round to thousands
                $executedAt = Carbon::now()->subDays(random_int(0, 30))->setTime(random_int(7, 17), random_int(0, 59));

                Transaction::create([
                    'user_id'      => $userId,
                    'portfolio_id' => $portfolio->id,
                    'security_id'  => 1, // Reference a valid security
                    'order_id'     => null,
                    'type'         => TransactionType::Deposit,
                    'quantity'     => null,
                    'price'        => null,
                    'total_amount' => $depositAmount,
                    'fee'          => 0,
                    'tax'          => 0,
                    'net_amount'   => $depositAmount,
                    'executed_at'  => $executedAt,
                    'notes'        => 'Nạp tiền vào tài khoản',
                    'created_at'   => $executedAt,
                    'updated_at'   => $executedAt,
                ]);
                $transactionCount++;

                // Update portfolio cash balance
                $portfolio->cash_balance = ((float) $portfolio->cash_balance) + $depositAmount;
                $portfolio->total_value = ((float) $portfolio->total_value) + $depositAmount;
                $portfolio->save();
            }

            // 5c. Additional withdrawal transactions
            for ($i = 0; $i < 8; $i++) {
                $portfolio = $allPortfolios[array_rand($allPortfolios)];
                $userId = $portfolioUsers[$portfolio->id] ?? $portfolio->user_id;

                $availableCash = (float) $portfolio->cash_balance;
                if ($availableCash < 500000) {
                    continue; // Skip if not enough cash
                }

                $withdrawAmount = round(min($availableCash * 0.3, random_int(1000000, 50000000)) / 1000) * 1000;
                if ($withdrawAmount <= 0) {
                    continue;
                }

                $executedAt = Carbon::now()->subDays(random_int(0, 30))->setTime(random_int(7, 17), random_int(0, 59));

                Transaction::create([
                    'user_id'      => $userId,
                    'portfolio_id' => $portfolio->id,
                    'security_id'  => 1,
                    'order_id'     => null,
                    'type'         => TransactionType::Withdrawal,
                    'quantity'     => null,
                    'price'        => null,
                    'total_amount' => $withdrawAmount,
                    'fee'          => 0,
                    'tax'          => 0,
                    'net_amount'   => $withdrawAmount,
                    'executed_at'  => $executedAt,
                    'notes'        => 'Rút tiền từ tài khoản',
                    'created_at'   => $executedAt,
                    'updated_at'   => $executedAt,
                ]);
                $transactionCount++;

                // Update portfolio cash balance
                $portfolio->cash_balance = max(0, ((float) $portfolio->cash_balance) - $withdrawAmount);
                $portfolio->total_value = max(0, ((float) $portfolio->total_value) - $withdrawAmount);
                $portfolio->save();
            }

            $this->command->info("  Created $transactionCount transactions");
        } catch (\Exception $e) {
            $this->command->error('  Transaction creation error: ' . $e->getMessage());
        }

        // ────────────────────────────────────────────────────────────────
        // SECTION 6: Additional Market Data (30 days, all 34 securities)
        // ────────────────────────────────────────────────────────────────
        try {
            $this->command->info('[6/7] Creating additional market data...');

            $securities = Security::all();
            $marketDataCount = 0;

            foreach ($securities as $security) {
                $basePrice = (float) $security->current_price;
                if ($basePrice <= 0) {
                    $basePrice = 50000;
                }

                $price = $basePrice;
                $now = Carbon::now();

                // Get the latest existing market data timestamp for this security
                $latestMarketData = MarketData::where('security_id', $security->id)
                    ->orderBy('timestamp', 'desc')
                    ->first();

                $startDay = 30;
                if ($latestMarketData) {
                    $lastDate = Carbon::parse($latestMarketData->timestamp);
                    $daysSinceLast = $now->diffInDays($lastDate);
                    $startDay = max(1, $daysSinceLast - 1);
                    $price = (float) $latestMarketData->close;
                }

                for ($i = $startDay; $i >= 1; $i--) {
                    $day = $now->copy()->subDays($i);
                    if ($day->isWeekend()) {
                        continue;
                    }

                    // Random walk with mean-reverting tendency
                    $dailyReturn = (random_int(-300, 300) / 10000); // -3% to +3%
                    // Add a slight positive bias for realistic market trend
                    $dailyReturn += 0.0005;
                    $price = $price * (1 + $dailyReturn);
                    $price = max($price, $basePrice * 0.5); // Floor at 50% of base
                    $price = min($price, $basePrice * 1.5); // Cap at 150% of base

                    $volatility = $price * 0.015;
                    $open = $price + (random_int(-100, 100) / 100) * $volatility;
                    $close = $open + (random_int(-80, 80) / 100) * $volatility;
                    $high = max($open, $close) + (random_int(0, 60) / 100) * $volatility;
                    $low = min($open, $close) - (random_int(0, 60) / 100) * $volatility;
                    $volume = random_int(200000, 8000000);

                    MarketData::create([
                        'security_id' => $security->id,
                        'timestamp'   => $day->setTime(9, 15, 0),
                        'open'        => round($open, 2),
                        'high'        => round($high, 2),
                        'low'         => round($low, 2),
                        'close'       => round($close, 2),
                        'volume'      => $volume,
                    ]);

                    $marketDataCount++;
                }
            }

            $this->command->info("  Created $marketDataCount market data records (30 days x " . $securities->count() . ' securities)');
        } catch (\Exception $e) {
            $this->command->error('  Market data creation error: ' . $e->getMessage());
        }

        // ────────────────────────────────────────────────────────────────
        // SECTION 7: Dividends for all 34 securities
        // ────────────────────────────────────────────────────────────────
        try {
            $this->command->info('[7/7] Creating dividends...');

            $securities = Security::all();
            $dividendCount = 0;

            foreach ($securities as $security) {
                $dividendYield = (float) ($security->dividend_yield ?? 0);
                $currentPrice = (float) ($security->current_price ?? 50000);

                // Calculate realistic dividend amount per share
                $amountPerShare = 0;
                if ($dividendYield > 0 && $currentPrice > 0) {
                    $annualDividend = $currentPrice * ($dividendYield / 100);
                    $amountPerShare = round($annualDividend / 4, 0); // Quarterly dividend
                } else {
                    // For securities without yield data, use a small default
                    $amountPerShare = round($currentPrice * (random_int(5, 30) / 10000), 0);
                }

                // Ensure minimum meaningful amount
                $amountPerShare = max(100, $amountPerShare);

                // 2-3 dividends per security over the past year
                $numDividends = random_int(2, 3);
                for ($d = 0; $d < $numDividends; $d++) {
                    $exDate = Carbon::now()->subDays(random_int(30, 365));
                    $paymentDate = $exDate->copy()->addDays(random_int(15, 45));
                    $recordDate = $exDate->copy()->subDays(random_int(1, 5));

                    Dividend::create([
                        'security_id'      => $security->id,
                        'ex_date'          => $exDate->format('Y-m-d'),
                        'payment_date'     => $paymentDate->format('Y-m-d'),
                        'record_date'      => $recordDate->format('Y-m-d'),
                        'amount_per_share' => round($amountPerShare * (random_int(80, 120) / 100), 0),
                        'currency'         => 'VND',
                        'dividend_type'    => DividendType::Cash,
                    ]);

                    $dividendCount++;
                }
            }

            $this->command->info("  Created $dividendCount dividend records for " . $securities->count() . ' securities');
        } catch (\Exception $e) {
            $this->command->error('  Dividend creation error: ' . $e->getMessage());
        }

        // ────────────────────────────────────────────────────────────────
        $this->command->info('');
        $this->command->info('=== Mass Data Seeding Complete! ===');
    }
}
