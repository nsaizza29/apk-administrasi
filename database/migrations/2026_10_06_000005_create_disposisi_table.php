<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disposisi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surat_masuk_id')->constrained('surat_masuk')->cascadeOnDelete();
            $table->foreignId('dari_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('kepada_user_id')->constrained('users')->cascadeOnDelete();
            $table->text('catatan');
            $table->enum('sifat', ['biasa', 'penting', 'segera'])->default('biasa');
            $table->date('batas_waktu')->nullable();
            $table->enum('status', ['pending', 'diproses', 'selesai'])->default('pending')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disposisi');
    }
};
