<?php

namespace Tests\Feature;

use App\Models\KlasifikasiSurat;
use App\Models\PengajuanSurat;
use App\Models\SuratKeluar;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PengajuanSuratTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_alur_pengajuan_dari_staf_sampai_selesai(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $pimpinan = $this->makeUser(User::ROLE_PIMPINAN, 'pimpinan@test.local');
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($staf)->post('/pengajuan', [
            'tujuan' => 'Dinas Kesehatan',
            'perihal' => 'Permohonan Data',
            'isi' => 'Mohon data terbaru.',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'catatan_pengaju' => 'Segera.',
        ])->assertRedirect();

        $pengajuan = PengajuanSurat::firstOrFail();
        $this->assertSame(PengajuanSurat::STATUS_DIAJUKAN, $pengajuan->status);
        $this->assertSame($staf->id, $pengajuan->pengaju_id);
        $this->assertGreaterThan(0, $admin->notifications()->count());

        $this->actingAs($admin)->post("/pengajuan/{$pengajuan->id}/dokumen", [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => $pengajuan->tujuan,
            'perihal' => $pengajuan->perihal,
            'isi' => $pengajuan->isi,
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'catatan_admin' => 'Sudah dibuat.',
        ])->assertRedirect();

        $pengajuan->refresh();
        $this->assertSame(PengajuanSurat::STATUS_MENUNGGU_PEMERIKSAAN, $pengajuan->status);
        $this->assertNotNull($pengajuan->surat_keluar_id);

        $this->actingAs($pimpinan)
            ->get("/pengajuan/{$pengajuan->id}")
            ->assertInertia(fn ($page) => $page->where('can.review', true));

        $this->actingAs($pimpinan)
            ->get('/pengajuan?tab=periksa')
            ->assertInertia(fn ($page) => $page->where('pengajuan.data.0.can_review', true));

        $suratKeluar = SuratKeluar::findOrFail($pengajuan->surat_keluar_id);
        $this->assertSame('draft', $suratKeluar->status);

        $this->actingAs($pimpinan)->post("/pengajuan/{$pengajuan->id}/periksa", [
            'keputusan' => 'setujui',
        ])->assertRedirect();

        $pengajuan->refresh();
        $this->assertSame(PengajuanSurat::STATUS_DISETUJUI, $pengajuan->status);
        $this->assertSame($pimpinan->id, $pengajuan->pemeriksa_id);

        $this->actingAs($admin)->post("/pengajuan/{$pengajuan->id}/selesai")->assertRedirect();

        $pengajuan->refresh();
        $this->assertSame(PengajuanSurat::STATUS_SELESAI, $pengajuan->status);
        $this->assertSame('dikirim', SuratKeluar::findOrFail($pengajuan->surat_keluar_id)->status);
    }

    public function test_staf_tidak_bisa_membuat_surat_keluar_langsung(): void
    {
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');

        $this->actingAs($staf)->get('/surat-keluar/create')->assertForbidden();
        $this->actingAs($staf)->post('/surat-keluar', [])->assertForbidden();
    }

    public function test_pengajuan_yang_sudah_punya_dokumen_tidak_dapat_dihapus(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($staf)->post('/pengajuan', [
            'tujuan' => 'Dinas Pendidikan',
            'perihal' => 'Undangan Rapat',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $pengajuan = PengajuanSurat::firstOrFail();

        $this->actingAs($admin)->post("/pengajuan/{$pengajuan->id}/dokumen", [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => $pengajuan->tujuan,
            'perihal' => $pengajuan->perihal,
            'isi' => 'Isi surat untuk pengujian.',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $this->actingAs($admin)->delete("/pengajuan/{$pengajuan->id}")->assertStatus(422);
        $this->assertModelExists($pengajuan);
    }

    public function test_pimpinan_dapat_mengajukan_dan_memeriksa_tetapi_tidak_membuat_dokumen(): void
    {
        $pimpinan = $this->makeUser(User::ROLE_PIMPINAN, 'pimpinan@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($pimpinan)->post('/pengajuan', [
            'tujuan' => 'Bank Daerah',
            'perihal' => 'Surat Pengantar',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'penting',
        ])->assertRedirect();

        $pengajuan = PengajuanSurat::firstOrFail();

        $this->actingAs($pimpinan)->post("/pengajuan/{$pengajuan->id}/dokumen", [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => $pengajuan->tujuan,
            'perihal' => $pengajuan->perihal,
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'penting',
        ])->assertForbidden();

        $this->actingAs($pimpinan)->post("/pengajuan/{$pengajuan->id}/selesai")->assertForbidden();
    }
}
