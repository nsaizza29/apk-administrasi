<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const OLD_BODY = "Sehubungan dengan {perihal}, kami mengharapkan kehadiran Bapak/Ibu pada:\n\nHari/Tanggal : {hari_tanggal}\nWaktu        : {waktu}\nTempat       : {tempat_acara}\nAcara        : {acara}\n\nMengingat pentingnya acara tersebut, kami mohon Bapak/Ibu dapat hadir tepat waktu.\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.";

    private const NEW_BODY = '<p>Sehubungan dengan {perihal}, kami mengharapkan kehadiran Bapak/Ibu pada:</p><table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td>{hari_tanggal}</td></tr><tr><td>Waktu</td><td>:</td><td>{waktu}</td></tr><tr><td>Tempat</td><td>:</td><td>{tempat_acara}</td></tr><tr><td>Acara</td><td>:</td><td>{acara}</td></tr></tbody></table><p>Mengingat pentingnya acara tersebut, kami mohon Bapak/Ibu dapat hadir tepat waktu.</p><p>Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.</p>';

    public function up(): void
    {
        DB::table('template_surat')
            ->where('slug', 'undangan')
            ->where('isi', self::OLD_BODY)
            ->update(['isi' => self::NEW_BODY, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('template_surat')
            ->where('slug', 'undangan')
            ->where('isi', self::NEW_BODY)
            ->update(['isi' => self::OLD_BODY, 'updated_at' => now()]);
    }
};
