<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_comments', function (Blueprint $table) {
            $table->id();
            $table->string('target_type', 32)->index();
            $table->unsignedBigInteger('target_id')->index();
            $table->string('author_name', 120);
            $table->string('author_email', 180)->nullable();
            $table->text('body');
            $table->boolean('is_approved')->default(true)->index();
            $table->timestamps();

            $table->index(['target_type', 'target_id', 'is_approved']);
        });

        Schema::create('content_likes', function (Blueprint $table) {
            $table->id();
            $table->string('target_type', 32)->index();
            $table->unsignedBigInteger('target_id')->index();
            $table->string('visitor_key', 64);
            $table->timestamps();

            $table->unique(['target_type', 'target_id', 'visitor_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_likes');
        Schema::dropIfExists('content_comments');
    }
};
