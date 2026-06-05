<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technical_indicators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('security_id')->constrained('securities');
            $table->foreignId('market_data_id')->nullable()->constrained('market_data');
            $table->dateTime('timestamp');
            $table->decimal('rsi_14', 10, 2)->nullable();
            $table->decimal('macd_line', 10, 2)->nullable();
            $table->decimal('macd_signal', 10, 2)->nullable();
            $table->decimal('macd_histogram', 10, 2)->nullable();
            $table->decimal('sma_20', 15, 2)->nullable();
            $table->decimal('sma_50', 15, 2)->nullable();
            $table->decimal('sma_200', 15, 2)->nullable();
            $table->decimal('ema_12', 15, 2)->nullable();
            $table->decimal('ema_26', 15, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technical_indicators');
    }
};
