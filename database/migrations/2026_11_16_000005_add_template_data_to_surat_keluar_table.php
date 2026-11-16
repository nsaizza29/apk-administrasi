<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->json('template_data')->nullable();
        });

        $this->replaceDefaultTemplate(
            'undangan',
            "Sehubungan dengan {perihal}, kami mengharapkan kehadiran Bapak/Ibu pada:\n\nHari/Tanggal : \nWaktu        : \nTempat       : \nAcara        : \n\nMengingat pentingnya acara tersebut, kami mohon Bapak/Ibu dapat hadir tepat waktu.\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.",
            "Sehubungan dengan {perihal}, kami mengharapkan kehadiran Bapak/Ibu pada:\n\nHari/Tanggal : {hari_tanggal}\nWaktu        : {waktu}\nTempat       : {tempat_acara}\nAcara        : {acara}\n\nMengingat pentingnya acara tersebut, kami mohon Bapak/Ibu dapat hadir tepat waktu.\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.",
        );

        $this->replaceDefaultTemplate(
            'tugas',
            "Dalam rangka {perihal}, dengan ini kami menugaskan:\n\nNama    : \nNIP     : \nJabatan : \n\nUntuk melaksanakan tugas tersebut dengan penuh tanggung jawab dan melaporkan hasilnya kepada pimpinan.\n\nDemikian surat tugas ini dibuat untuk dilaksanakan sebagaimana mestinya.",
            "Dalam rangka {perihal}, dengan ini kami menugaskan:\n\nNama    : {nama_petugas}\nNIP     : {nip_petugas}\nJabatan : {jabatan_petugas}\n\nUntuk melaksanakan tugas tersebut dengan penuh tanggung jawab dan melaporkan hasilnya kepada pimpinan.\n\nDemikian surat tugas ini dibuat untuk dilaksanakan sebagaimana mestinya.",
        );

        $this->replaceDefaultTemplate(
            'keterangan',
            "Yang bertanda tangan di bawah ini menerangkan bahwa:\n\nNama    : \nNIP     : \nJabatan : \n\nbenar-benar \n\nDemikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.",
            "Yang bertanda tangan di bawah ini menerangkan bahwa:\n\nNama    : {nama_petugas}\nNIP     : {nip_petugas}\nJabatan : {jabatan_petugas}\n\nbenar-benar {status_keterangan}\n\nDemikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.",
        );
    }

    public function down(): void
    {
        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->dropColumn('template_data');
        });
    }

    private function replaceDefaultTemplate(string $slug, string $old, string $new): void
    {
        DB::table('template_surat')
            ->where('slug', $slug)
            ->where('isi', $old)
            ->update(['isi' => $new, 'updated_at' => now()]);
    }
};
