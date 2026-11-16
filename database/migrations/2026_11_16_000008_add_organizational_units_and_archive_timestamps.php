<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizational_units', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('parent_id')->nullable()->constrained('organizational_units')->restrictOnDelete();
            $table->timestamps();
        });

        $now = now();
        $foundationId = DB::table('organizational_units')->insertGetId([
            'name' => 'Yayasan',
            'slug' => 'yayasan',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $unitIds = [$foundationId];

        foreach ([
            ['PAUD', 'paud'],
            ['TK', 'tk'],
            ['SD', 'sd'],
            ['SMP', 'smp'],
            ['SMA', 'sma'],
        ] as [$name, $slug]) {
            $unitIds[] = DB::table('organizational_units')->insertGetId([
                'name' => $name,
                'slug' => $slug,
                'parent_id' => $foundationId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $tables = ['users', 'surat_masuk', 'surat_keluar', 'pengajuan_surat', 'disposisi', 'klasifikasi_surat'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('unit_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('organizational_units')
                    ->restrictOnDelete();
            });

            DB::table($tableName)->whereNull('unit_id')->update(['unit_id' => $foundationId]);
        }

        Schema::table('klasifikasi_surat', function (Blueprint $table) {
            $table->dropUnique('klasifikasi_surat_kode_unique');
            $table->unique(['unit_id', 'kode']);
        });

        $classifications = DB::table('klasifikasi_surat')
            ->where('unit_id', $foundationId)
            ->get();

        foreach (array_slice($unitIds, 1) as $unitId) {
            foreach ($classifications as $classification) {
                DB::table('klasifikasi_surat')->insert([
                    'unit_id' => $unitId,
                    'kode' => $classification->kode,
                    'nama' => $classification->nama,
                    'deskripsi' => $classification->deskripsi,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        Schema::table('pengaturan', function (Blueprint $table) {
            $table->foreignId('unit_id')
                ->nullable()
                ->after('id')
                ->constrained('organizational_units')
                ->restrictOnDelete();
            $table->unique('unit_id');
        });
        DB::table('pengaturan')->whereNull('unit_id')->update(['unit_id' => $foundationId]);

        Schema::table('surat_masuk', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->index();
            $table->dropUnique('surat_masuk_nomor_agenda_unique');
            $table->unique(['unit_id', 'nomor_agenda']);
        });
        DB::table('surat_masuk')->where('status', 'selesai')->update(['archived_at' => $now]);
        DB::table('surat_masuk')->where('status', 'diarsipkan')->update([
            'status' => 'selesai',
            'archived_at' => $now,
        ]);

        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->index();
            $table->dropUnique('surat_keluar_nomor_surat_unique');
            $table->unique(['unit_id', 'nomor_surat']);
        });
        DB::table('surat_keluar')->where('status', 'dikirim')->update(['archived_at' => $now]);
        DB::table('surat_keluar')->where('status', 'diarsipkan')->update([
            'status' => 'dikirim',
            'archived_at' => $now,
        ]);

        Schema::table('pengajuan_surat', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->index();
            $table->dropUnique('pengajuan_surat_nomor_pengajuan_unique');
            $table->unique(['unit_id', 'nomor_pengajuan']);
        });
        DB::table('pengajuan_surat')->where('status', 'selesai')->update(['archived_at' => $now]);
    }

    public function down(): void
    {
        DB::table('surat_masuk')->whereNotNull('archived_at')->update(['status' => 'diarsipkan']);
        DB::table('surat_keluar')->whereNotNull('archived_at')->update(['status' => 'diarsipkan']);

        Schema::table('surat_masuk', function (Blueprint $table) {
            $table->dropUnique(['unit_id', 'nomor_agenda']);
            $table->unique('nomor_agenda');
            $table->dropIndex(['archived_at']);
            $table->dropColumn('archived_at');
        });

        Schema::table('surat_keluar', function (Blueprint $table) {
            $table->dropUnique(['unit_id', 'nomor_surat']);
            $table->unique('nomor_surat');
            $table->dropIndex(['archived_at']);
            $table->dropColumn('archived_at');
        });

        Schema::table('pengajuan_surat', function (Blueprint $table) {
            $table->dropUnique(['unit_id', 'nomor_pengajuan']);
            $table->unique('nomor_pengajuan');
            $table->dropIndex(['archived_at']);
            $table->dropColumn('archived_at');
        });

        Schema::table('pengaturan', function (Blueprint $table) {
            $table->dropUnique(['unit_id']);
            $table->dropConstrainedForeignId('unit_id');
        });

        DB::table('klasifikasi_surat')
            ->where('unit_id', '!=', DB::table('organizational_units')->where('slug', 'yayasan')->value('id'))
            ->delete();
        Schema::table('klasifikasi_surat', function (Blueprint $table) {
            $table->dropUnique(['unit_id', 'kode']);
            $table->unique('kode');
        });

        foreach (['klasifikasi_surat', 'disposisi', 'pengajuan_surat', 'surat_keluar', 'surat_masuk', 'users'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('unit_id');
            });
        }

        Schema::dropIfExists('organizational_units');
    }
};
