<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('securities', function (Blueprint $table) {
            $table->id();
            $table->string('symbol', 20)->unique();
            $table->string('name');
            $table->string('exchange', 50);
            $table->string('type'); // stock, bond, etf, index
            $table->string('sector')->nullable();
            $table->string('industry')->nullable();
            $table->decimal('market_cap', 20, 2)->nullable();
            $table->decimal('current_price', 15, 2)->nullable();
            $table->decimal('eps', 10, 2)->nullable();
            $table->decimal('pe_ratio', 10, 2)->nullable();
            $table->decimal('dividend_yield', 5, 2)->nullable();
            $table->bigInteger('volume')->nullable();
            $table->decimal('day_high', 15, 2)->nullable();
            $table->decimal('day_low', 15, 2)->nullable();
            $table->decimal('year_high', 15, 2)->nullable();
            $table->decimal('year_low', 15, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('securities');
    }
};
