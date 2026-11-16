<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_surat', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('slug')->unique();
            $table->text('deskripsi')->nullable();
            $table->longText('isi');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();

        DB::table('template_surat')->insert([
            [
                'nama' => 'Surat Umum',
                'slug' => 'umum',
                'deskripsi' => 'Susunan surat resmi untuk keperluan umum.',
                'isi' => "Sehubungan dengan {perihal}, bersama ini kami sampaikan hal-hal sebagai berikut:\n\n1. \n2. \n3. \n\nDemikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Surat Undangan',
                'slug' => 'undangan',
                'deskripsi' => 'Undangan rapat, kegiatan, atau acara resmi.',
                'isi' => "Sehubungan dengan {perihal}, kami mengharapkan kehadiran Bapak/Ibu pada:\n\nHari/Tanggal : \nWaktu        : \nTempat       : \nAcara        : \n\nMengingat pentingnya acara tersebut, kami mohon Bapak/Ibu dapat hadir tepat waktu.\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Surat Pemberitahuan',
                'slug' => 'pemberitahuan',
                'deskripsi' => 'Menyampaikan informasi atau kebijakan baru.',
                'isi' => "Dengan ini kami beritahukan bahwa {perihal}.\n\nAdapun ketentuan lebih lanjut adalah sebagai berikut:\n\n1. \n2. \n3. \n\nDemikian pemberitahuan ini kami sampaikan untuk menjadi perhatian Bapak/Ibu.",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Surat Permohonan',
                'slug' => 'permohonan',
                'deskripsi' => 'Mengajukan permohonan data, izin, atau bantuan.',
                'isi' => "Sehubungan dengan {perihal}, kami mengajukan permohonan kepada Bapak/Ibu untuk:\n\n1. \n2. \n3. \n\nDemikian permohonan ini kami sampaikan. Atas perhatian dan persetujuan Bapak/Ibu, kami ucapkan terima kasih.",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Surat Tugas',
                'slug' => 'tugas',
                'deskripsi' => 'Menugaskan pegawai untuk melaksanakan kegiatan.',
                'isi' => "Dalam rangka {perihal}, dengan ini kami menugaskan:\n\nNama    : \nNIP     : \nJabatan : \n\nUntuk melaksanakan tugas tersebut dengan penuh tanggung jawab dan melaporkan hasilnya kepada pimpinan.\n\nDemikian surat tugas ini dibuat untuk dilaksanakan sebagaimana mestinya.",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'nama' => 'Surat Keterangan',
                'slug' => 'keterangan',
                'deskripsi' => 'Menerangkan status atau kondisi tertentu.',
                'isi' => "Yang bertanda tangan di bawah ini menerangkan bahwa:\n\nNama    : \nNIP     : \nJabatan : \n\nbenar-benar \n\nDemikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('template_surat');
    }
};
