<?php

namespace App\Http\Controllers;

use App\Models\KlasifikasiSurat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class KlasifikasiController extends Controller
{
    public function index(Request $request): Response
    {
        $items = KlasifikasiSurat::withCount(['suratMasuk', 'suratKeluar'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->input('q').'%';

                return $q->where(fn ($w) => $w
                    ->where('kode', 'like', $term)
                    ->orWhere('nama', 'like', $term));
            })
            ->orderBy('kode')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('klasifikasi/index', [
            'klasifikasi' => $items,
            'filters' => $request->only(['q']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $data = $this->validated($request);
        $data['unit_id'] = $request->user()->unit_id;

        KlasifikasiSurat::create($data);

        return back()->with('success', 'Klasifikasi surat berhasil ditambahkan.');
    }

    public function update(Request $request, KlasifikasiSurat $klasifikasi): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $data = $this->validated($request, $klasifikasi->id);

        $klasifikasi->update($data);

        return back()->with('success', 'Klasifikasi surat berhasil diperbarui.');
    }

    public function destroy(Request $request, KlasifikasiSurat $klasifikasi): RedirectResponse
    {
        $this->authorizeAdmin($request);

        abort_if(
            $klasifikasi->suratMasuk()->exists() || $klasifikasi->suratKeluar()->exists(),
            422,
            'Klasifikasi tidak dapat dihapus karena masih digunakan oleh surat.',
        );

        $klasifikasi->delete();

        return back()->with('success', 'Klasifikasi surat berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'kode' => [
                'required', 'string', 'max:20',
                Rule::unique('klasifikasi_surat', 'kode')
                    ->where('unit_id', $request->user()->unit_id)
                    ->ignore($ignoreId),
            ],
            'nama' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless($request->user()->isAdmin(), 403, 'Hanya admin yang dapat mengelola klasifikasi.');
    }
}
