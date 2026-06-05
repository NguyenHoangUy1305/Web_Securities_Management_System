<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolio_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained('portfolios');
            $table->foreignId('security_id')->constrained('securities');
            $table->decimal('quantity', 15, 4)->default(0);
            $table->decimal('avg_buy_price', 15, 2)->default(0);
            $table->decimal('current_value', 20, 2)->default(0);
            $table->decimal('profit_loss', 20, 2)->default(0);
            $table->decimal('profit_loss_percent', 8, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_items');
    }
};
