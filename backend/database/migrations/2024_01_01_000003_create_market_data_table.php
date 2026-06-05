<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('market_data', function (Blueprint $table) {
            $table->id();
            $table->foreignId('security_id')->constrained('securities');
            $table->dateTime('timestamp');
            $table->decimal('open', 15, 2);
            $table->decimal('high', 15, 2);
            $table->decimal('low', 15, 2);
            $table->decimal('close', 15, 2);
            $table->bigInteger('volume');

            $table->index(['security_id', 'timestamp']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('market_data');
    }
};
