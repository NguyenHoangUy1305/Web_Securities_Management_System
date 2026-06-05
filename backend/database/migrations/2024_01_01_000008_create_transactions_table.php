<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('portfolio_id')->constrained('portfolios');
            $table->foreignId('security_id')->constrained('securities');
            $table->foreignId('order_id')->nullable()->constrained('orders');
            $table->string('type'); // buy, sell, dividend, deposit, withdrawal
            $table->decimal('quantity', 15, 4)->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->decimal('total_amount', 20, 2);
            $table->decimal('fee', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('net_amount', 20, 2);
            $table->dateTime('executed_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
