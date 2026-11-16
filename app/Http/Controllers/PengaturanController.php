<?php

namespace App\Http\Controllers;

use App\Models\Pengaturan;
use App\Support\StoreUpload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanController extends Controller
{
    public function edit(): Response
    {
        $pengaturan = Pengaturan::current();

        return Inertia::render('pengaturan/index', [
            'pengaturan' => [
                ...$pengaturan->only([
                    'nama_instansi',
                    'alamat',
                    'telepon',
                    'email',
                    'website',
                    'kota',
                    'nama_pimpinan',
                    'jabatan_pimpinan',
                    'nip_pimpinan',
                ]),
                'logo' => $pengaturan->logo ? [
                    'url' => url('/storage/'.$pengaturan->logo),
                    'nama' => basename($pengaturan->logo),
                ] : null,
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $pengaturan = Pengaturan::current();

        $data = $request->validate([
            'nama_instansi' => ['nullable', 'string', 'max:255'],
            'alamat' => ['nullable', 'string', 'max:1000'],
            'telepon' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'kota' => ['nullable', 'string', 'max:100'],
            'nama_pimpinan' => ['nullable', 'string', 'max:255'],
            'jabatan_pimpinan' => ['nullable', 'string', 'max:255'],
            'nip_pimpinan' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        unset($data['logo']);

        if ($request->hasFile('logo')) {
            if ($pengaturan->logo) {
                Storage::disk('public')->delete($pengaturan->logo);
            }

            $data['logo'] = StoreUpload::public(
                $request->file('logo'),
                'logo/'.$request->user()->organizationalUnit->slug,
            );
        }

        $pengaturan->update($data);

        return back()->with('success', 'Pengaturan instansi berhasil disimpan.');
    }
}
