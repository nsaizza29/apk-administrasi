<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_surat', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_pengajuan', 40)->unique();
            $table->foreignId('pengaju_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('klasifikasi_id')->constrained('klasifikasi_surat')->cascadeOnDelete();
            $table->string('tujuan');
            $table->string('perihal');
            $table->text('isi')->nullable();
            $table->enum('sifat', ['biasa', 'penting', 'segera'])->default('biasa');
            $table->string('lampiran')->nullable();
            $table->string('status', 30)->default('diajukan')->index();
            $table->text('catatan_pengaju')->nullable();
            $table->text('catatan_admin')->nullable();
            $table->text('catatan_pemeriksa')->nullable();
            $table->foreignId('pemeriksa_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('surat_keluar_id')->nullable()->constrained('surat_keluar')->nullOnDelete();
            $table->timestamp('diajukan_at')->nullable();
            $table->timestamp('diperiksa_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_surat');
    }
};
