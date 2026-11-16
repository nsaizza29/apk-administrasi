<?php

namespace Tests\Feature;

use App\Models\KlasifikasiSurat;
use App\Models\PengajuanSurat;
use App\Models\Pengaturan;
use App\Models\SuratKeluar;
use App\Models\TemplateSurat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SuratKeluarTemplateTest extends TestCase
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

    public function test_admin_dapat_menyusun_surat_dengan_template_dan_mencetaknya(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tempat_surat' => 'Bandung',
            'tujuan' => 'Dinas Pendidikan',
            'perihal' => 'Undangan Rapat Koordinasi',
            'jumlah_lampiran' => '1 (satu) berkas',
            'isi' => "Sehubungan dengan agenda koordinasi, kami mengundang Bapak/Ibu.\n\nDemikian undangan ini kami sampaikan.",
            'template' => 'undangan',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'penting',
            'status' => 'draft',
            'penandatangan_nama' => 'Kepala Kantor',
            'penandatangan_jabatan' => 'Kepala Kantor',
            'tembusan' => "1. Arsip\n2. Bagian Umum",
        ])->assertRedirect();

        $surat = SuratKeluar::firstOrFail();
        $this->assertSame('undangan', $surat->template);
        $this->assertSame('Bandung', $surat->tempat_surat);
        $this->assertSame('1 (satu) berkas', $surat->jumlah_lampiran);
        $this->assertSame('Kepala Kantor', $surat->penandatangan_nama);

        $this->actingAs($admin)
            ->get("/surat-keluar/{$surat->id}/cetak")
            ->assertOk()
            ->assertSee('Undangan Rapat Koordinasi')
            ->assertSee('Dengan hormat')
            ->assertSee('Dinas Pendidikan')
            ->assertSee('1 (satu) berkas')
            ->assertSee('Bagian Umum')
            ->assertSee('Cetak / Simpan PDF');
    }

    public function test_pengaturan_instansi_menjadi_default_kop_dan_penandatangan(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($admin)->put('/pengaturan', [
            'nama_instansi' => 'PEMERINTAH KOTA CONTOH',
            'alamat' => 'Jl. Merdeka No. 1',
            'telepon' => '(022) 123456',
            'email' => 'admin@contoh.go.id',
            'website' => 'www.contoh.go.id',
            'kota' => 'Contoh',
            'nama_pimpinan' => 'Dr. Pimpinan',
            'jabatan_pimpinan' => 'Kepala Dinas',
            'nip_pimpinan' => '198001012005011001',
        ])->assertRedirect();

        $this->assertSame('PEMERINTAH KOTA CONTOH', Pengaturan::current()->nama_instansi);

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => 'Masyarakat',
            'perihal' => 'Pemberitahuan',
            'isi' => 'Isi surat.',
            'template' => 'pemberitahuan',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $surat = SuratKeluar::firstOrFail();
        $this->assertSame('Contoh', $surat->tempat_surat);
        $this->assertSame('Dr. Pimpinan', $surat->penandatangan_nama);
        $this->assertSame('Kepala Dinas', $surat->penandatangan_jabatan);

        $this->actingAs($admin)
            ->get("/surat-keluar/{$surat->id}/cetak")
            ->assertOk()
            ->assertSee('PEMERINTAH KOTA CONTOH')
            ->assertSee('Jl. Merdeka No. 1')
            ->assertSee('Dr. Pimpinan')
            ->assertSee('198001012005011001');
    }

    public function test_staf_tidak_dapat_mengubah_pengaturan_instansi(): void
    {
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');

        $this->actingAs($staf)->get('/pengaturan')->assertForbidden();
        $this->actingAs($staf)->put('/pengaturan', [])->assertForbidden();
    }

    public function test_isi_surat_dirender_otomatis_dari_template_dan_detail(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        TemplateSurat::create([
            'nama' => 'Surat Rapat',
            'slug' => 'rapat',
            'deskripsi' => 'Template rapat.',
            'isi' => "Agenda: {acara}\nTanggal: {tanggal}\nTempat: {tempat_acara}",
            'is_active' => true,
        ]);

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => 'Seluruh Pegawai',
            'perihal' => 'Rapat Koordinasi',
            'template' => 'rapat',
            'details' => [
                'acara' => 'Rapat Koordinasi Bulanan',
                'tempat_acara' => 'Aula Kantor',
            ],
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $surat = SuratKeluar::firstOrFail();

        $this->assertStringContainsString('Agenda: Rapat Koordinasi Bulanan', $surat->isi);
        $this->assertStringContainsString('Tempat: Aula Kantor', $surat->isi);
        $this->assertStringContainsString(now()->translatedFormat('d F Y'), $surat->isi);
        $this->assertSame('Rapat Koordinasi Bulanan', $surat->template_data['acara']);
    }

    public function test_format_rich_text_template_tampil_di_detail_dan_cetak(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = $this->makeKlasifikasi();
        TemplateSurat::create([
            'nama' => 'Format Surat',
            'slug' => 'format-surat',
            'isi' => '<p><strong>{perihal}</strong></p><table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td>{agenda}</td></tr></tbody></table><ol><li><em>{agenda}</em></li></ol>',
            'is_active' => true,
        ]);

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => 'Dinas Pendidikan',
            'perihal' => 'Rapat Koordinasi',
            'template' => 'format-surat',
            'details' => ['agenda' => 'Pembahasan Rencana Kerja'],
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $surat = SuratKeluar::firstOrFail();
        $this->assertSame(
            '<p><strong>Rapat Koordinasi</strong></p><table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td>Pembahasan Rencana Kerja</td></tr></tbody></table><ol><li><em>Pembahasan Rencana Kerja</em></li></ol>',
            $surat->isi,
        );

        $this->actingAs($admin)
            ->get("/surat-keluar/{$surat->id}")
            ->assertInertia(fn ($page) => $page->where(
                'surat.isi',
                '<p><strong>Rapat Koordinasi</strong></p><table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td>Pembahasan Rencana Kerja</td></tr></tbody></table><ol><li><em>Pembahasan Rencana Kerja</em></li></ol>',
            ));

        $this->actingAs($admin)
            ->get("/surat-keluar/{$surat->id}/cetak")
            ->assertOk()
            ->assertSee('<strong>Rapat Koordinasi</strong>', false)
            ->assertSee('<table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td>Pembahasan Rencana Kerja</td></tr></tbody></table>', false)
            ->assertSee('<ol><li><em>Pembahasan Rencana Kerja</em></li></ol>', false);
    }

    public function test_proses_pengajuan_menyimpan_template_dan_tanda_tangan(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($staf)->post('/pengajuan', [
            'tujuan' => 'Dinas Kesehatan',
            'perihal' => 'Permohonan Data',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $pengajuan = PengajuanSurat::firstOrFail();

        $this->actingAs($admin)->post("/pengajuan/{$pengajuan->id}/dokumen", [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => $pengajuan->tujuan,
            'perihal' => $pengajuan->perihal,
            'isi' => 'Isi surat dari template.',
            'template' => 'permohonan',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $surat = SuratKeluar::firstOrFail();
        $this->assertSame('permohonan', $surat->template);
        $this->assertNotNull($surat->penandatangan_nama);
        $this->assertNotNull($surat->tempat_surat);
    }
}
