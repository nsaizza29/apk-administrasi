<?php

namespace Tests\Feature;

use App\Models\KlasifikasiSurat;
use App\Models\TemplateSurat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TemplateSuratTest extends TestCase
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

    public function test_template_awal_tersedia(): void
    {
        $this->assertDatabaseCount('template_surat', 6);
        $this->assertDatabaseHas('template_surat', ['slug' => 'undangan', 'is_active' => true]);
        $this->assertStringContainsString(
            '<table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td>{hari_tanggal}</td></tr>',
            TemplateSurat::where('slug', 'undangan')->value('isi'),
        );
    }

    public function test_admin_dapat_menambah_mengubah_dan_menghapus_template(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');

        $this->actingAs($admin)->get('/template-surat')->assertOk();

        $this->actingAs($admin)->post('/template-surat', [
            'nama' => 'Surat Edaran',
            'slug' => '',
            'deskripsi' => 'Edaran internal.',
            'isi' => 'Dengan ini kami sampaikan {perihal}.',
            'is_active' => true,
        ])->assertRedirect();

        $template = TemplateSurat::where('slug', 'surat-edaran')->firstOrFail();

        $this->actingAs($admin)->put("/template-surat/{$template->id}", [
            'nama' => 'Surat Edaran Baru',
            'slug' => 'edaran-baru',
            'deskripsi' => 'Edaran internal terbaru.',
            'isi' => 'Isi edaran baru.',
            'is_active' => false,
        ])->assertRedirect();

        $this->assertDatabaseHas('template_surat', [
            'slug' => 'edaran-baru',
            'nama' => 'Surat Edaran Baru',
            'is_active' => false,
        ]);

        $this->actingAs($admin)->delete("/template-surat/{$template->id}")->assertRedirect();
        $this->assertDatabaseMissing('template_surat', ['slug' => 'edaran-baru']);
    }

    public function test_template_menyimpan_format_editor_yang_diizinkan_dan_membersihkan_html_berbahaya(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');

        $this->actingAs($admin)->post('/template-surat', [
            'nama' => 'Template Format',
            'slug' => 'template-format',
            'deskripsi' => 'Format teks untuk surat.',
            'isi' => '<p><strong>{perihal}</strong></p><table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td>{hari}</td></tr></tbody></table><ol><li><em>Daftar</em></li></ol><script>alert(1)</script><img src=x onerror=alert(1)>',
            'is_active' => true,
        ])->assertRedirect();

        $template = TemplateSurat::where('slug', 'template-format')->firstOrFail();
        $this->assertSame(
            '<p><strong>{perihal}</strong></p><table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td>{hari}</td></tr></tbody></table><ol><li><em>Daftar</em></li></ol>',
            $template->isi,
        );
        $this->assertSame(
            '<p><strong>&lt;script&gt;alert(1)&lt;/script&gt;</strong></p><table><tbody><tr><td>Hari/Tanggal</td><td>:</td><td></td></tr></tbody></table><ol><li><em>Daftar</em></li></ol>',
            TemplateSurat::render('template-format', ['perihal' => '<script>alert(1)</script>']),
        );
    }

    public function test_staf_tidak_dapat_mengelola_template(): void
    {
        $staf = $this->makeUser(User::ROLE_STAF, 'staf@test.local');

        $this->actingAs($staf)->get('/template-surat')->assertForbidden();
        $this->actingAs($staf)->post('/template-surat', [])->assertForbidden();
    }

    public function test_template_yang_dipakai_surat_tidak_dapat_dihapus(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = KlasifikasiSurat::create(['kode' => '001', 'nama' => 'Umum']);
        $template = TemplateSurat::where('slug', 'undangan')->firstOrFail();

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => 'Dinas Pendidikan',
            'perihal' => 'Undangan Rapat',
            'isi' => 'Isi undangan.',
            'template' => 'undangan',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertRedirect();

        $this->actingAs($admin)->delete("/template-surat/{$template->id}")->assertStatus(422);
        $this->assertDatabaseHas('template_surat', ['slug' => 'undangan']);
    }

    public function test_surat_keluar_menolak_template_yang_tidak_ada(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN, 'admin@test.local');
        $klasifikasi = KlasifikasiSurat::create(['kode' => '001', 'nama' => 'Umum']);

        $this->actingAs($admin)->post('/surat-keluar', [
            'tanggal_surat' => now()->toDateString(),
            'tujuan' => 'Dinas Pendidikan',
            'perihal' => 'Surat Uji',
            'isi' => 'Isi surat.',
            'template' => 'tidak-ada',
            'klasifikasi_id' => $klasifikasi->id,
            'sifat' => 'biasa',
        ])->assertSessionHasErrors('template');
    }
}
