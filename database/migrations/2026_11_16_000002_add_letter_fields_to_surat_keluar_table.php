<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->string('template', 30)->default('umum')->after('sifat');
            $table->string('tempat_surat', 100)->nullable()->after('tanggal_surat');
            $table->string('jumlah_lampiran', 50)->nullable()->after('perihal');
            $table->string('penandatangan_nama')->nullable()->after('isi');
            $table->string('penandatangan_jabatan')->nullable()->after('penandatangan_nama');
            $table->text('tembusan')->nullable()->after('penandatangan_jabatan');
        });
    }

    public function down(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->dropColumn([
                'template',
                'tempat_surat',
                'jumlah_lampiran',
                'penandatangan_nama',
                'penandatangan_jabatan',
                'tembusan',
            ]);
        });
    }
};
