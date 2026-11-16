<?php

namespace Tests\Feature;

use App\Models\KlasifikasiSurat;
use App\Models\PengajuanSurat;
use App\Models\SuratKeluar;
use App\Models\SuratMasuk;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' User',
            'email' => $role.'@test.local',
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

    public function test_only_admin_can_manage_official_letters_and_archiving(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        $staf = $this->makeUser(User::ROLE_STAF);
        $pimpinan = $this->makeUser(User::ROLE_PIMPINAN);
        $klasifikasi = $this->makeKlasifikasi();

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => 'Dinas Pendidikan',
            'perihal' => 'Undangan Rapat',
            'template' => 'umum',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $suratKeluar = SuratKeluar::firstOrFail();

        $this->actingAs($admin)->post('/surat-masuk', [
            'tanggal_surat' => now()->toDateString(),
            'tanggal_diterima' => now()->toDateString(),
            'asal' => 'Dinas Pendidikan',
            'perihal' => 'Permohonan Data',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $suratMasuk = SuratMasuk::firstOrFail();

        foreach ([$staf, $pimpinan] as $user) {
            $this->actingAs($user)
                ->get('/surat-keluar/create')
                ->assertForbidden();
            $this->actingAs($user)
                ->post('/surat-keluar', [])
                ->assertForbidden();
            $this->actingAs($user)
                ->get("/surat-keluar/{$suratKeluar->id}/edit")
                ->assertForbidden();
            $this->actingAs($user)
                ->put("/surat-keluar/{$suratKeluar->id}", [])
                ->assertForbidden();
            $this->actingAs($user)
                ->delete("/surat-keluar/{$suratKeluar->id}")
                ->assertForbidden();
            $this->actingAs($user)
                ->patch("/arsip/surat_keluar/{$suratKeluar->id}")
                ->assertForbidden();
            $this->actingAs($user)
                ->get("/surat-keluar/{$suratKeluar->id}")
                ->assertOk();

            $this->actingAs($user)
                ->get('/surat-masuk/create')
                ->assertForbidden();
            $this->actingAs($user)
                ->post('/surat-masuk', [])
                ->assertForbidden();
            $this->actingAs($user)
                ->get("/surat-masuk/{$suratMasuk->id}/edit")
                ->assertForbidden();
            $this->actingAs($user)
                ->put("/surat-masuk/{$suratMasuk->id}", [])
                ->assertForbidden();
            $this->actingAs($user)
                ->delete("/surat-masuk/{$suratMasuk->id}")
                ->assertForbidden();
        }

        $this->actingAs($admin)
            ->put("/surat-keluar/{$suratKeluar->id}", [
                'tanggal_surat' => now()->toDateString(),
                'tujuan' => 'Dinas Kesehatan',
                'perihal' => 'Undangan Rapat Revisi',
                'klasifikasi_id' => $klasifikasi->id,
                'sifat' => 'penting',
                'status' => 'dikirim',
            ])
            ->assertRedirect();

        $this->assertSame('Undangan Rapat Revisi', $suratKeluar->refresh()->perihal);
        $this->assertNotNull($suratKeluar->archived_at);
        $this->assertSame('dikirim', $suratKeluar->status);

        $this->actingAs($admin)
            ->put("/surat-masuk/{$suratMasuk->id}", [
                'tanggal_surat' => now()->toDateString(),
                'tanggal_diterima' => now()->toDateString(),
                'asal' => 'Dinas Kesehatan',
                'perihal' => 'Permohonan Data Revisi',
                'klasifikasi_id' => $klasifikasi->id,
                'sifat' => 'penting',
            ])
            ->assertRedirect();

        $this->assertSame('Permohonan Data Revisi', $suratMasuk->refresh()->perihal);

        $this->actingAs($admin)
            ->patch("/arsip/surat_keluar/{$suratKeluar->id}")
            ->assertRedirect();
        $this->assertNull($suratKeluar->refresh()->archived_at);

        $this->actingAs($admin)->delete("/surat-keluar/{$suratKeluar->id}")->assertRedirect();
        $this->actingAs($admin)->delete("/surat-masuk/{$suratMasuk->id}")->assertRedirect();
    }

    public function test_staff_and_leadership_can_submit_and_manage_their_own_editable_requests(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);
        $staf = $this->makeUser(User::ROLE_STAF);
        $pimpinan = $this->makeUser(User::ROLE_PIMPINAN);
        $klasifikasi = $this->makeKlasifikasi();
        $pengajuanByRole = [];

        foreach ([$staf, $pimpinan] as $user) {
            $this->actingAs($user)->post('/pengajuan', [
                'tujuan' => 'Dinas Pendidikan',
                'perihal' => 'Permohonan Dokumen '.$user->role,
                'klasifikasi_id' => $klasifikasi->id,
                'sifat' => 'biasa',
            ])->assertRedirect();

            $pengajuan = PengajuanSurat::where('pengaju_id', $user->id)->firstOrFail();
            $pengajuanByRole[$user->role] = $pengajuan;

            $this->actingAs($user)
                ->get("/pengajuan/{$pengajuan->id}")
                ->assertOk()
                ->assertInertia(fn ($page) => $page
                    ->where('can.edit', true)
                    ->where('can.delete', true));

            $this->actingAs($user)
                ->get("/pengajuan/{$pengajuan->id}/edit")
                ->assertOk();
            $this->actingAs($user)
                ->put("/pengajuan/{$pengajuan->id}", [
                    'tujuan' => 'Dinas Kesehatan',
                    'perihal' => 'Permohonan Dokumen Diperbarui '.$user->role,
                    'klasifikasi_id' => $klasifikasi->id,
                    'sifat' => 'penting',
                ])
                ->assertRedirect();
        }

        $this->actingAs($staf)
            ->get("/pengajuan/{$pengajuanByRole[User::ROLE_PIMPINAN]->id}/edit")
            ->assertForbidden();
        $this->actingAs($pimpinan)
            ->get("/pengajuan/{$pengajuanByRole[User::ROLE_STAF]->id}/edit")
            ->assertForbidden();

        $this->actingAs($admin)->get("/pengajuan/{$pengajuanByRole[User::ROLE_STAF]->id}/edit")->assertOk();
        $this->actingAs($admin)
            ->put("/pengajuan/{$pengajuanByRole[User::ROLE_STAF]->id}", [
                'tujuan' => 'Dinas Kesehatan',
                'perihal' => 'Permohonan Dokumen Diperbarui',
                'klasifikasi_id' => $klasifikasi->id,
                'sifat' => 'penting',
            ])
            ->assertRedirect();
        $this->actingAs($admin)->delete("/pengajuan/{$pengajuanByRole[User::ROLE_STAF]->id}")->assertRedirect();
        $this->assertDatabaseMissing('pengajuan_surat', ['id' => $pengajuanByRole[User::ROLE_STAF]->id]);
    }
}
