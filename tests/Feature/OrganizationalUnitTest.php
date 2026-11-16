<?php

namespace Tests\Feature;

use App\Models\KlasifikasiSurat;
use App\Models\OrganizationalUnit;
use App\Models\PengajuanSurat;
use App\Models\Pengaturan;
use App\Models\SuratKeluar;
use App\Models\SuratMasuk;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OrganizationalUnitTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role, string $email, ?int $unitId = null): User
    {
        return User::create([
            'name' => ucfirst($role).' User',
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => $role,
            ...($unitId ? ['unit_id' => $unitId] : []),
        ]);
    }

    private function makeKlasifikasi(): KlasifikasiSurat
    {
        return KlasifikasiSurat::create([
            'kode' => '001',
            'nama' => 'Umum',
        ]);
    }

    public function test_units_are_seeded_under_foundation_and_users_are_scoped_to_their_unit(): void
    {
        $foundation = OrganizationalUnit::where('slug', 'yayasan')->firstOrFail();
        $paud = OrganizationalUnit::where('slug', 'paud')->firstOrFail();
        $foundationAdmin = $this->makeUser(User::ROLE_ADMIN, 'foundation-admin@test.local');
        $paudAdmin = $this->makeUser(User::ROLE_ADMIN, 'paud-admin@test.local', $paud->id);
        $this->makeUser(User::ROLE_STAF, 'paud-staf@test.local', $paud->id);
        $klasifikasi = $this->makeKlasifikasi();

        $this->assertSame(6, OrganizationalUnit::count());
        $this->assertSame($foundation->id, $paud->parent_id);
        $this->assertSame($foundation->id, $foundationAdmin->unit_id);

        $this->actingAs($foundationAdmin)->post('/surat-masuk', [
            'tanggal_surat' => now()->toDateString(),
            'tanggal_diterima' => now()->toDateString(),
            'asal' => 'Yayasan',
            'perihal' => 'Surat Yayasan',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $foundationSurat = SuratMasuk::where('unit_id', $foundation->id)->firstOrFail();
        $this->actingAs($foundationAdmin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Surat Keluar Yayasan',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();
        $foundationSuratKeluar = SuratKeluar::where('unit_id', $foundation->id)->firstOrFail();

        $this->actingAs($foundationAdmin)->post('/pengajuan', [
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Pengajuan Yayasan',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();
        $foundationPengajuan = PengajuanSurat::where('unit_id', $foundation->id)->firstOrFail();

        $this->actingAs($paudAdmin)->post('/klasifikasi', [
            'kode' => '001',
            'nama' => 'Umum',
        ])->assertRedirect();
        $paudKlasifikasi = KlasifikasiSurat::where('unit_id', $paud->id)->firstOrFail();

        $this->actingAs($paudAdmin)
            ->get('/surat-masuk')
            ->assertInertia(fn ($page) => $page->where('surat.total', 0));
        $this->actingAs($paudAdmin)->get("/surat-masuk/{$foundationSurat->id}")->assertNotFound();
        $this->actingAs($paudAdmin)->get("/surat-keluar/{$foundationSuratKeluar->id}")->assertNotFound();
        $this->actingAs($paudAdmin)->get("/pengajuan/{$foundationPengajuan->id}")->assertNotFound();
        $this->actingAs($paudAdmin)
            ->get('/users')
            ->assertInertia(fn ($page) => $page
                ->where('users.total', 1)
                ->where('users.data.0.email', 'paud-staf@test.local'));
        $this->actingAs($foundationAdmin)->put("/users/{$paudAdmin->id}", [
            'name' => $paudAdmin->name,
            'email' => $paudAdmin->email,
            'role' => $paudAdmin->role,
        ])->assertSessionHasErrors('role');

        $this->actingAs($paudAdmin)->post('/surat-masuk', [
            'tanggal_surat' => now()->toDateString(),
            'tanggal_diterima' => now()->toDateString(),
            'asal' => 'PAUD',
            'perihal' => 'Surat PAUD',
            'klasifikasi_id' => $paudKlasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $paudSurat = SuratMasuk::where('unit_id', $paud->id)->firstOrFail();
        $this->assertSame($foundationSurat->nomor_agenda, $paudSurat->nomor_agenda);
    }

    public function test_completed_incoming_outgoing_and_requests_are_automatically_archived_per_unit(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');
        $pimpinan = $this->makeUser(User::ROLE_PIMPINAN, 'pimpinan@test.local');
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($admin)->post('/surat-masuk', [
            'tanggal_surat' => now()->toDateString(),
            'tanggal_diterima' => now()->toDateString(),
            'asal' => 'Dinas Contoh',
            'perihal' => 'Surat Masuk Selesai',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'status' => 'selesai',
        ])->assertRedirect();

        $suratMasuk = SuratMasuk::firstOrFail();
        $this->assertNotNull($suratMasuk->archived_at);

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Surat Keluar Dikirim',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
            'status' => 'dikirim',
        ])->assertRedirect();

        $suratKeluar = SuratKeluar::firstOrFail();
        $this->assertNotNull($suratKeluar->archived_at);

        $this->actingAs($staf)->post('/pengajuan', [
            'tujuan' => 'Dinas Contoh',
            'perihal' => 'Pengajuan Selesai',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $pengajuan = PengajuanSurat::firstOrFail();

        $this->actingAs($admin)->post("/pengajuan/{$pengajuan->id}/dokumen", [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => $pengajuan->tujuan,
            'perihal' => $pengajuan->perihal,
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $this->actingAs($pimpinan)->post("/pengajuan/{$pengajuan->id}/periksa", [
            'keputusan' => 'setujui',
        ])->assertRedirect();
        $this->actingAs($admin)->post("/pengajuan/{$pengajuan->id}/selesai")->assertRedirect();

        $pengajuan->refresh();
        $suratKeluarPengajuan = SuratKeluar::findOrFail($pengajuan->surat_keluar_id);
        $this->assertSame(PengajuanSurat::STATUS_SELESAI, $pengajuan->status);
        $this->assertNotNull($pengajuan->archived_at);
        $this->assertNotNull($suratKeluarPengajuan->archived_at);

        $this->actingAs($admin)
            ->get('/arsip?jenis=surat_masuk')
            ->assertInertia(fn ($page) => $page->where('jumlahArsip.surat_masuk', 1));
        $this->actingAs($admin)
            ->get('/arsip?jenis=surat_keluar')
            ->assertInertia(fn ($page) => $page->where('jumlahArsip.surat_keluar', 2));
        $this->actingAs($admin)
            ->get('/arsip?jenis=pengajuan')
            ->assertInertia(fn ($page) => $page->where('jumlahArsip.pengajuan', 1));
    }

    public function test_letterhead_settings_are_separate_for_each_unit(): void
    {
        $foundation = OrganizationalUnit::where('slug', 'yayasan')->firstOrFail();
        $paud = OrganizationalUnit::where('slug', 'paud')->firstOrFail();
        $foundationAdmin = $this->makeUser(User::ROLE_ADMIN, 'foundation@test.local');
        $paudAdmin = $this->makeUser(User::ROLE_ADMIN, 'paud@test.local', $paud->id);

        $this->actingAs($foundationAdmin)->put('/pengaturan', [
            'nama_instansi' => 'YAYASAN CONTOH',
        ])->assertRedirect();
        $this->actingAs($paudAdmin)->put('/pengaturan', [
            'nama_instansi' => 'PAUD CONTOH',
        ])->assertRedirect();

        $this->assertSame(
            'YAYASAN CONTOH',
            Pengaturan::where('unit_id', $foundation->id)->value('nama_instansi'),
        );
        $this->assertSame(
            'PAUD CONTOH',
            Pengaturan::where('unit_id', $paud->id)->value('nama_instansi'),
        );
    }

    public function test_foundation_assigns_unit_admins_from_users_and_unit_admins_manage_staff_and_leadership(): void
    {
        $foundation = OrganizationalUnit::where('slug', 'yayasan')->firstOrFail();
        $paud = OrganizationalUnit::where('slug', 'paud')->firstOrFail();
        $foundationAdmin = $this->makeUser(User::ROLE_ADMIN, 'foundation@test.local');

        $this->actingAs($foundationAdmin)->post('/users', [
            'unit_id' => $paud->id,
            'name' => 'Admin PAUD',
            'email' => 'admin-paud@test.local',
            'password' => 'password123',
            'role' => User::ROLE_ADMIN,
            'jabatan' => 'Administrator PAUD',
        ])->assertRedirect();

        $unitAdmin = User::where('email', 'admin-paud@test.local')->firstOrFail();
        $this->assertSame(User::ROLE_ADMIN, $unitAdmin->role);
        $this->assertSame($paud->id, $unitAdmin->unit_id);

        $this->actingAs($foundationAdmin)->get('/users')
            ->assertInertia(fn ($page) => $page
                ->where('canAssignUnitAdmins', true)
                ->where('users.total', 1)
                ->where('users.data.0.email', 'admin-paud@test.local')
                ->where('users.data.0.unit_name', 'PAUD'));
        $this->actingAs($foundationAdmin)->post('/users', [
            'unit_id' => $paud->id,
            'name' => 'Admin Duplikat',
            'email' => 'admin-duplikat@test.local',
            'password' => 'password123',
            'role' => User::ROLE_ADMIN,
        ])->assertSessionHasErrors('unit_id');
        $this->actingAs($foundationAdmin)->put("/users/{$unitAdmin->id}", [
            'name' => 'Admin PAUD Diperbarui',
            'email' => 'admin-paud@test.local',
            'jabatan' => 'Admin PAUD',
        ])->assertRedirect();
        $this->actingAs($foundationAdmin)->get('/unit-admins')->assertNotFound();

        $this->actingAs($unitAdmin)->post('/users', [
            'name' => 'Staf PAUD',
            'email' => 'staf-paud@test.local',
            'password' => 'password123',
            'role' => User::ROLE_STAF,
        ])->assertRedirect();
        $this->actingAs($unitAdmin)->post('/users', [
            'name' => 'Pimpinan PAUD',
            'email' => 'pimpinan-paud@test.local',
            'password' => 'password123',
            'role' => User::ROLE_PIMPINAN,
        ])->assertRedirect();
        $this->actingAs($unitAdmin)->post('/users', [
            'name' => 'Admin Tambahan',
            'email' => 'admin-tambahan@test.local',
            'password' => 'password123',
            'role' => User::ROLE_ADMIN,
        ])->assertSessionHasErrors('role');

        $this->actingAs($unitAdmin)->get('/unit-admins')->assertNotFound();
        $this->actingAs($unitAdmin)->get('/users')
            ->assertInertia(fn ($page) => $page
                ->where('canAssignUnitAdmins', false)
                ->where('users.total', 2));
        $this->assertDatabaseHas('users', [
            'email' => 'staf-paud@test.local',
            'unit_id' => $paud->id,
            'role' => User::ROLE_STAF,
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'pimpinan-paud@test.local',
            'unit_id' => $paud->id,
            'role' => User::ROLE_PIMPINAN,
        ]);

        $this->assertSame($foundation->id, $foundationAdmin->unit_id);
    }

    public function test_database_seeder_creates_classifications_for_every_unit(): void
    {
        $this->seed(DatabaseSeeder::class);

        foreach (OrganizationalUnit::all() as $unit) {
            $this->assertSame(5, KlasifikasiSurat::where('unit_id', $unit->id)->count());
        }

        $this->assertDatabaseHas('users', [
            'email' => 'admin@surat.test',
            'unit_id' => OrganizationalUnit::where('slug', 'yayasan')->value('id'),
            'role' => User::ROLE_ADMIN,
        ]);
    }
}
