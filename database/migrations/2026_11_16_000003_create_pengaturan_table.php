<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengaturan', function (Blueprint $table) {
            $table->id();
            $table->string('nama_instansi')->nullable();
            $table->text('alamat')->nullable();
            $table->string('telepon', 100)->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('logo')->nullable();
            $table->string('kota', 100)->nullable();
            $table->string('nama_pimpinan')->nullable();
            $table->string('jabatan_pimpinan')->nullable();
            $table->string('nip_pimpinan', 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengaturan');
    }
};
