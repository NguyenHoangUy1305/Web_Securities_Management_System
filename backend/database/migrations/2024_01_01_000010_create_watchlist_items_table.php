<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('watchlist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('watchlist_id')->constrained('watchlists');
            $table->foreignId('security_id')->constrained('securities');
            $table->decimal('alert_price_above', 15, 2)->nullable();
            $table->decimal('alert_price_below', 15, 2)->nullable();
            $table->boolean('alert_enabled')->default(false);
            $table->timestamps();

            $table->unique(['watchlist_id', 'security_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('watchlist_items');
    }
};
