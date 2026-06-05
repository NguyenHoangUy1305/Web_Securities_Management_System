<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dividends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('security_id')->constrained('securities');
            $table->date('ex_date');
            $table->date('payment_date')->nullable();
            $table->date('record_date')->nullable();
            $table->decimal('amount_per_share', 15, 4);
            $table->string('currency', 10)->default('USD');
            $table->string('dividend_type'); // cash, stock
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dividends');
    }
};
