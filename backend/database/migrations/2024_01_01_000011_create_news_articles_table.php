<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('source')->nullable();
            $table->string('url')->unique();
            $table->text('summary')->nullable();
            $table->text('content')->nullable();
            $table->string('sentiment')->nullable(); // positive, negative, neutral
            $table->foreignId('related_security_id')->nullable()->constrained('securities');
            $table->dateTime('published_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_articles');
    }
};
