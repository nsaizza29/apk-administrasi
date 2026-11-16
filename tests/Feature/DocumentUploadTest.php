<?php

namespace Tests\Feature;

use App\Models\KlasifikasiSurat;
use App\Models\PengajuanSurat;
use App\Models\Pengaturan;
use App\Models\SuratKeluar;
use App\Models\SuratMasuk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_surat_masuk_dapat_mengganti_lampiran_saat_diperbarui(): void
    {
        Storage::fake('public');
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($admin)->post('/surat-masuk', [
            'tanggal_surat' => '2026-11-01',
            'tanggal_diterima' => '2026-11-02',
            'asal' => 'Dinas Contoh',
            'perihal' => 'Surat Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'lampiran' => UploadedFile::fake()->create('awal.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $surat = SuratMasuk::firstOrFail();
        $lampiranLama = $surat->lampiran;

        $this->actingAs($admin)->post("/surat-masuk/{$surat->id}", [
            '_method' => 'PUT',
            'tanggal_surat' => '2026-11-01',
            'tanggal_diterima' => '2026-11-02',
            'asal' => 'Dinas Contoh',
            'perihal' => 'Surat Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'lampiran' => UploadedFile::fake()->create('baru.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $surat->refresh();
        $this->assertNotSame($lampiranLama, $surat->lampiran);
        $this->assertSame('baru.pdf', basename($surat->lampiran));
        Storage::disk('public')->assertExists($surat->lampiran);
        Storage::disk('public')->assertMissing($lampiranLama);
    }

    public function test_surat_keluar_dapat_mengganti_lampiran_saat_diperbarui(): void
    {
        Storage::fake('public');
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => '2026-11-01',
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Surat Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'lampiran' => UploadedFile::fake()->create('awal.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $surat = SuratKeluar::firstOrFail();
        $lampiranLama = $surat->lampiran;

        $this->actingAs($admin)->post("/surat-keluar/{$surat->id}", [
            '_method' => 'PUT',
            'tanggal_surat' => '2026-11-01',
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Surat Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'lampiran' => UploadedFile::fake()->create('baru.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $surat->refresh();
        $this->assertNotSame($lampiranLama, $surat->lampiran);
        $this->assertSame('baru.pdf', basename($surat->lampiran));
        Storage::disk('public')->assertExists($surat->lampiran);
        Storage::disk('public')->assertMissing($lampiranLama);
    }

    public function test_pengajuan_dapat_mengganti_lampiran_saat_diperbarui(): void
    {
        Storage::fake('public');
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($staf)->post('/pengajuan', [
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Dokumen Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'lampiran' => UploadedFile::fake()->create('awal.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $pengajuan = PengajuanSurat::firstOrFail();
        $lampiranLama = $pengajuan->lampiran;

        $this->actingAs($staf)->post("/pengajuan/{$pengajuan->id}", [
            '_method' => 'PUT',
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Dokumen Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'lampiran' => UploadedFile::fake()->create('baru.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $pengajuan->refresh();
        $this->assertNotSame($lampiranLama, $pengajuan->lampiran);
        $this->assertSame('baru.pdf', basename($pengajuan->lampiran));
        Storage::disk('public')->assertExists($pengajuan->lampiran);
        Storage::disk('public')->assertMissing($lampiranLama);
    }

    public function test_nama_lampiran_pengajuan_dipertahankan_saat_dibuat_menjadi_surat(): void
    {
        Storage::fake('public');
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($staf)->post('/pengajuan', [
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Dokumen Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'lampiran' => UploadedFile::fake()->create('dokumen-final.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $pengajuan = PengajuanSurat::firstOrFail();

        $this->actingAs($admin)->post("/pengajuan/{$pengajuan->id}/dokumen", [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => $pengajuan->tujuan,
            'perihal' => $pengajuan->perihal,
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $this->assertSame('dokumen-final.pdf', basename($pengajuan->refresh()->suratKeluar->lampiran));
    }

    public function test_logo_dan_lampiran_menggunakan_host_aplikasi_saat_ini(): void
    {
        Storage::fake('public');
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = $this->makeKlasifikasi();
        $logoPath = 'logo/instansi.png';
        Storage::disk('public')->put($logoPath, 'logo');
        Pengaturan::current()->update(['logo' => $logoPath]);

        $this->actingAs($admin)
            ->get('http://apk-administrasi.test/pengaturan')
            ->assertInertia(fn ($page) => $page->where(
                'pengaturan.logo.url',
                'http://apk-administrasi.test/storage/'.$logoPath,
            ));

        $this->actingAs($admin)->post('/surat-masuk', [
            'tanggal_surat' => '2026-11-01',
            'tanggal_diterima' => '2026-11-02',
            'asal' => 'Dinas Contoh',
            'perihal' => 'Surat Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'lampiran' => UploadedFile::fake()->create('lampiran.pdf', 10, 'application/pdf'),
        ])->assertRedirect();

        $suratMasuk = SuratMasuk::firstOrFail();
        $this->actingAs($admin)
            ->get("http://apk-administrasi.test/surat-masuk/{$suratMasuk->id}")
            ->assertInertia(fn ($page) => $page->where(
                'surat.lampiran.url',
                'http://apk-administrasi.test/storage/'.$suratMasuk->lampiran,
            ));

        $suratKeluar = SuratKeluar::create([
            'nomor_surat' => '001/001/2026',
            'tanggal_surat' => '2026-11-01',
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Surat Uji',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'status' => 'draft',
            'user_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->get("http://apk-administrasi.test/surat-keluar/{$suratKeluar->id}/cetak")
            ->assertOk()
            ->assertSee('src="http://apk-administrasi.test/storage/'.$logoPath.'"', false);
    }

    private function makeUser(string $role, string $email): User
    {
        return User::create([
            'name' => ucfirst($role).' User',
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => $role,
        ]);
    }

    private function makeKlasifikasi(): KlasifikasiSurat
    {
        return KlasifikasiSurat::create([
            'kode' => '001',
            'nama' => 'Umum',
        ]);
    }
}
