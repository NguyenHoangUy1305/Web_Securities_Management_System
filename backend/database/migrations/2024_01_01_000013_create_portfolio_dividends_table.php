<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolio_dividends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_id')->constrained('portfolios');
            $table->foreignId('dividend_id')->constrained('dividends');
            $table->foreignId('security_id')->constrained('securities');
            $table->decimal('shares_owned', 15, 4);
            $table->decimal('total_amount', 20, 2);
            $table->date('received_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_dividends');
    }
};
