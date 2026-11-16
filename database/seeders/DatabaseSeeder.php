<?php

namespace Database\Seeders;

use App\Models\Disposisi;
use App\Models\KlasifikasiSurat;
use App\Models\OrganizationalUnit;
use App\Models\SuratKeluar;
use App\Models\SuratMasuk;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $foundationId = OrganizationalUnit::foundationId();

        $admin = User::firstOrCreate(['email' => 'admin@surat.test'], [
            'name' => 'Administrator',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'jabatan' => 'Admin Sistem',
            'unit_id' => $foundationId,
        ]);

        $pimpinan = User::firstOrCreate(['email' => 'pimpinan@surat.test'], [
            'name' => 'Kepala Kantor',
            'password' => Hash::make('password'),
            'role' => User::ROLE_PIMPINAN,
            'jabatan' => 'Kepala Kantor',
            'unit_id' => $foundationId,
        ]);

        $stafBudi = User::firstOrCreate(['email' => 'staf@surat.test'], [
            'name' => 'Budi Santoso',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STAF,
            'jabatan' => 'Staf Tata Usaha',
            'unit_id' => $foundationId,
        ]);

        $stafSiti = User::firstOrCreate(['email' => 'siti@surat.test'], [
            'name' => 'Siti Aminah',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STAF,
            'jabatan' => 'Staf Umum',
            'unit_id' => $foundationId,
        ]);

        $klasifikasiData = [
            ['kode' => '001', 'nama' => 'Umum', 'deskripsi' => 'Surat yang tidak termasuk klasifikasi lain.'],
            ['kode' => '002', 'nama' => 'Kepegawaian', 'deskripsi' => 'Surat urusan pegawai dan SDM.'],
            ['kode' => '003', 'nama' => 'Keuangan', 'deskripsi' => 'Surat urusan anggaran dan keuangan.'],
            ['kode' => '004', 'nama' => 'Pengadaan', 'deskripsi' => 'Surat pengadaan barang dan jasa.'],
            ['kode' => '005', 'nama' => 'Perizinan', 'deskripsi' => 'Surat perizinan dan rekomendasi.'],
        ];

        foreach (OrganizationalUnit::query()->get() as $unit) {
            foreach ($klasifikasiData as $item) {
                KlasifikasiSurat::firstOrCreate(
                    ['unit_id' => $unit->id, 'kode' => $item['kode']],
                    ['nama' => $item['nama'], 'deskripsi' => $item['deskripsi']],
                );
            }
        }

        $klasifikasi = KlasifikasiSurat::where('unit_id', $foundationId)->get();

        // $asal = [
        //     'Dinas Pendidikan', 'Dinas Kesehatan', 'Kementerian Keuangan', 'Bank Indonesia',
        //     'Pemerintah Provinsi', 'Universitas Gadjah Mada', 'PT. Telkom Indonesia',
        //     'Komisi Informasi Pusat', 'Otoritas Jasa Keuangan', 'Badan Kepegawaian Negara',
        // ];

        // $perihalMasuk = [
        //     'Undangan Rapat Koordinasi', 'Permohonan Data Statistik', 'Notulen Hasil Evaluasi',
        //     'Permintaan Laporan Triwulan', 'Pemberitahuan Jadwal Pelatihan', 'Surat Rekomendasi Teknis',
        //     'Permohonan Izin Riset', 'Undangan Seminar Nasional', 'Balasan Permohonan Kerja Sama',
        //     'Pengumuman Seleksi Penerimaan', 'Permintaan Konfirmasi Anggaran', 'Surat Perintah Tugas',
        // ];

        // $perihalKeluar = [
        //     'Surat Permohonan Data', 'Laporan Kegiatan Triwulan', 'Undangan Rakor Internal',
        //     'Surat Rekomendasi Teknis', 'Permohonan Izin Kegiatan', 'Balasan Undangan Seminar',
        //     'Surat Pernyataan Kesanggupan', 'Proposal Kerja Sama', 'Laporan Penggunaan Anggaran',
        //     'Surat Permintaan Potongan Anggaran',
        // ];

        // $tujuan = [
        //     'Dinas Pendidikan', 'Bank Indonesia', 'Pemerintah Provinsi', 'Universitas Indonesia',
        //     'PT. Telkom Indonesia', 'Kementerian Keuangan', 'Badan Kepegawaian Negara',
        //     'Dinas Kesehatan', 'Otoritas Jasa Keuangan',
        // ];

        // $sifat = ['biasa', 'biasa', 'penting', 'segera'];
        // $statusesMasuk = ['diterima', 'diproses', 'selesai'];

        // $users = [$stafBudi, $stafSiti];

        // for ($i = 1; $i <= 24; $i++) {
        //     $tanggal = now()->subDays(rand(1, 180));
        //     $klas = $klasifikasi->random();
        //     $pencatat = $users[array_rand($users)];

        //     $surat = SuratMasuk::create([
        //         'nomor_agenda' => sprintf('SM/%d/%03d', now()->year, $i),
        //         'tanggal_surat' => $tanggal->copy()->subDays(rand(0, 3)),
        //         'tanggal_diterima' => $tanggal,
        //         'asal' => $asal[array_rand($asal)],
        //         'perihal' => $perihalMasuk[array_rand($perihalMasuk)],
        //         'isi' => 'Bersama ini kami sampaikan berkaitan dengan "'.end($perihalMasuk).'" yang memerlukan tindak lanjut dari pihak kami.',
        //         'klasifikasi_id' => $klas->id,
        //         'sifat' => $sifat[array_rand($sifat)],
        //         'status' => $statusesMasuk[array_rand($statusesMasuk)],
        //         'user_id' => $pencatat->id,
        //         'created_at' => $tanggal,
        //         'updated_at' => $tanggal,
        //     ]);

        //     if ($i % 3 === 0) {
        //         Disposisi::create([
        //             'surat_masuk_id' => $surat->id,
        //             'dari_user_id' => $pimpinan->id,
        //             'kepada_user_id' => $users[array_rand($users)]->id,
        //             'catatan' => 'Mohon segera ditindaklanjuti dan laporkan perkembangannya.',
        //             'sifat' => $sifat[array_rand($sifat)],
        //             'batas_waktu' => now()->addDays(rand(3, 30)),
        //             'status' => ['pending', 'diproses', 'selesai'][rand(0, 2)],
        //         ]);
        //     }
        // }

        // $statusesKeluar = ['draft', 'dikirim', 'diterima'];

        // for ($i = 1; $i <= 18; $i++) {
        //     $tanggal = now()->subDays(rand(1, 180));
        //     $klas = $klasifikasi->random();
        //     $pencatat = $i % 4 === 0 ? $stafBudi : $pimpinan;

        //     SuratKeluar::create([
        //         'nomor_surat' => sprintf('%03d/%s/%d', $i, $klas->kode, now()->year),
        //         'tanggal_surat' => $tanggal,
        //         'tujuan' => $tujuan[array_rand($tujuan)],
        //         'perihal' => $perihalKeluar[array_rand($perihalKeluar)],
        //         'isi' => 'Dengan hormat, bersama ini kami sampaikan surat terkait "'.end($perihalKeluar).'" untuk dapat diproses sebagaimana mestinya.',
        //         'klasifikasi_id' => $klas->id,
        //         'sifat' => $sifat[array_rand($sifat)],
        //         'status' => $statusesKeluar[array_rand($statusesKeluar)],
        //         'user_id' => $pencatat->id,
        //         'created_at' => $tanggal,
        //         'updated_at' => $tanggal,
        //     ]);
        // }
    }
}
