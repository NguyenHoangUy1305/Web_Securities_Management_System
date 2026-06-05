<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Public routes (no authentication required)
Route::post('register', [App\Http\Controllers\Api\Auth\AuthController::class, 'register']);
Route::post('login', [App\Http\Controllers\Api\Auth\AuthController::class, 'login']);

// Public securities & market data (GET only)
Route::get('securities/search', [App\Http\Controllers\Api\Securities\SecurityController::class, 'search']);
Route::get('securities/top-gainers', [App\Http\Controllers\Api\Securities\SecurityController::class, 'topGainers']);
Route::get('securities/top-losers', [App\Http\Controllers\Api\Securities\SecurityController::class, 'topLosers']);
Route::get('securities/{symbol}/by-symbol', [App\Http\Controllers\Api\Securities\SecurityController::class, 'getBySymbol']);
Route::get('securities', [App\Http\Controllers\Api\Securities\SecurityController::class, 'index']);
Route::get('securities/{id}', [App\Http\Controllers\Api\Securities\SecurityController::class, 'show']);

// Public market data
Route::get('market-data/{securityId}/history', [App\Http\Controllers\Api\MarketData\MarketDataController::class, 'history']);
Route::get('market-data/{securityId}/ohlc', [App\Http\Controllers\Api\MarketData\MarketDataController::class, 'ohlc']);
Route::get('market-data/{securityId}/latest', [App\Http\Controllers\Api\MarketData\MarketDataController::class, 'latest']);
Route::get('market-data/{securityId}/indicators', [App\Http\Controllers\Api\MarketData\MarketDataController::class, 'indicators']);

// Public news
Route::get('news/market-summary', [App\Http\Controllers\Api\News\NewsController::class, 'marketSummary']);
Route::get('news/search/{keyword}', [App\Http\Controllers\Api\News\NewsController::class, 'search']);
Route::get('news/by-security/{securityId}', [App\Http\Controllers\Api\News\NewsController::class, 'bySecurity']);
Route::get('news', [App\Http\Controllers\Api\News\NewsController::class, 'index']);
Route::get('news/{id}', [App\Http\Controllers\Api\News\NewsController::class, 'show']);

// Public dividends (read-only)
Route::get('dividends/upcoming', [App\Http\Controllers\Api\Dividends\DividendController::class, 'upcoming']);
Route::get('dividends/calendar', [App\Http\Controllers\Api\Dividends\DividendController::class, 'calendar']);
Route::get('dividends', [App\Http\Controllers\Api\Dividends\DividendController::class, 'index']);
Route::get('dividends/{id}', [App\Http\Controllers\Api\Dividends\DividendController::class, 'show']);

// Authenticated routes
Route::middleware('auth:api')->group(function () {
    // Auth
    Route::post('logout', [App\Http\Controllers\Api\Auth\AuthController::class, 'logout']);
    Route::post('refresh', [App\Http\Controllers\Api\Auth\AuthController::class, 'refresh']);
    Route::get('me', [App\Http\Controllers\Api\Auth\AuthController::class, 'me']);
    Route::put('profile', [App\Http\Controllers\Api\Auth\AuthController::class, 'updateProfile']);
    Route::put('password', [App\Http\Controllers\Api\Auth\AuthController::class, 'updatePassword']);

    // User management (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', App\Http\Controllers\Api\Auth\UserManagementController::class)->except(['show']);
    });

    // Securities (admin write)
    Route::post('securities', [App\Http\Controllers\Api\Securities\SecurityController::class, 'store']);
    Route::put('securities/{id}', [App\Http\Controllers\Api\Securities\SecurityController::class, 'update']);
    Route::delete('securities/{id}', [App\Http\Controllers\Api\Securities\SecurityController::class, 'destroy']);

    // Portfolios (personal - need auth)
    Route::get('portfolios/{id}/summary', [App\Http\Controllers\Api\Portfolio\PortfolioController::class, 'summary']);
    Route::get('portfolios/{id}/allocation', [App\Http\Controllers\Api\Portfolio\PortfolioController::class, 'allocation']);
    Route::get('portfolios/{id}/performance', [App\Http\Controllers\Api\Portfolio\PortfolioController::class, 'performance']);
    Route::apiResource('portfolios', App\Http\Controllers\Api\Portfolio\PortfolioController::class);

    // Orders (personal - need auth)
    Route::post('orders/{id}/cancel', [App\Http\Controllers\Api\Orders\OrderController::class, 'cancel']);
    Route::put('orders/{id}/modify', [App\Http\Controllers\Api\Orders\OrderController::class, 'modify']);
    Route::get('orders/book/{securityId}', [App\Http\Controllers\Api\Orders\OrderController::class, 'orderBook']);
    Route::get('orders/my-orders', [App\Http\Controllers\Api\Orders\OrderController::class, 'myOrders']);
    Route::apiResource('orders', App\Http\Controllers\Api\Orders\OrderController::class);

    // Transactions (personal - need auth)
    Route::get('transactions/export/{format}', [App\Http\Controllers\Api\Transactions\TransactionController::class, 'export']);
    Route::get('transactions/summary', [App\Http\Controllers\Api\Transactions\TransactionController::class, 'summary']);
    Route::apiResource('transactions', App\Http\Controllers\Api\Transactions\TransactionController::class);

    // Watchlists (personal - need auth)
    Route::post('watchlists/{id}/add-security', [App\Http\Controllers\Api\Watchlist\WatchlistController::class, 'addSecurity']);
    Route::delete('watchlists/{id}/remove-security/{securityId}', [App\Http\Controllers\Api\Watchlist\WatchlistController::class, 'removeSecurity']);
    Route::put('watchlist-items/{id}/alert', [App\Http\Controllers\Api\Watchlist\WatchlistController::class, 'updateAlert']);
    Route::get('watchlists/alerts', [App\Http\Controllers\Api\Watchlist\WatchlistController::class, 'alerts']);
    Route::apiResource('watchlists', App\Http\Controllers\Api\Watchlist\WatchlistController::class);

    // News (admin write)
    Route::post('news', [App\Http\Controllers\Api\News\NewsController::class, 'store']);
    Route::put('news/{id}', [App\Http\Controllers\Api\News\NewsController::class, 'update']);
    Route::delete('news/{id}', [App\Http\Controllers\Api\News\NewsController::class, 'destroy']);

    // Dividends (personal)
    Route::get('dividends/historical/{securityId}', [App\Http\Controllers\Api\Dividends\DividendController::class, 'historical']);
    Route::get('dividends/my-dividends', [App\Http\Controllers\Api\Dividends\DividendController::class, 'myDividends']);
    Route::post('dividends/record', [App\Http\Controllers\Api\Dividends\DividendController::class, 'record']);

    // AI Assistant
    Route::post('ai/ask', [App\Http\Controllers\Api\AI\AIController::class, 'ask']);
    Route::post('ai/analyze-company', [App\Http\Controllers\Api\AI\AIController::class, 'analyzeCompany']);
    Route::post('ai/explain-metric', [App\Http\Controllers\Api\AI\AIController::class, 'explainMetric']);
    Route::post('ai/summarize-news', [App\Http\Controllers\Api\AI\AIController::class, 'summarizeNews']);
    Route::post('ai/investment-advice', [App\Http\Controllers\Api\AI\AIController::class, 'investmentAdvice']);
});
