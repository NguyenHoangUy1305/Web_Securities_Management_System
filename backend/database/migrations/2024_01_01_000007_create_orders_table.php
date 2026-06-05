<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('portfolio_id')->constrained('portfolios');
            $table->foreignId('security_id')->constrained('securities');
            $table->string('type'); // buy, sell
            $table->string('order_type'); // market, limit, stop
            $table->decimal('quantity', 15, 4);
            $table->decimal('price', 15, 2)->nullable();
            $table->decimal('total_amount', 20, 2)->nullable();
            $table->string('status'); // pending, open, filled, partial, cancelled, rejected
            $table->decimal('filled_quantity', 15, 4)->nullable();
            $table->decimal('filled_price', 15, 2)->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
