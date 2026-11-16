<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_masuk', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_agenda', 40)->unique();
            $table->string('nomor_surat');
            $table->date('tanggal_surat');
            $table->date('tanggal_diterima');
            $table->string('asal');
            $table->string('perihal');
            $table->text('isi')->nullable();
            $table->foreignId('klasifikasi_id')->constrained('klasifikasi_surat')->cascadeOnDelete();
            $table->enum('sifat', ['biasa', 'penting', 'segera'])->default('biasa');
            $table->enum('status', ['diterima', 'diproses', 'selesai', 'diarsipkan'])->default('diterima')->index();
            $table->string('lampiran')->nullable();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_masuk');
    }
};
