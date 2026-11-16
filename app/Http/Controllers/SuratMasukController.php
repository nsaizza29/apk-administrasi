<?php

namespace App\Http\Controllers;

use App\Models\KlasifikasiSurat;
use App\Models\SuratMasuk;
use App\Support\StoreUpload;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SuratMasukController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'status', 'klasifikasi_id', 'sifat']);

        $query = SuratMasuk::with(['klasifikasi', 'user'])
            ->when(
                ! $request->filled('status'),
                fn ($q) => $q->whereNull('archived_at'),
            )
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->input('q').'%';

                return $q->where(fn ($w) => $w
                    ->where('nomor_agenda', 'like', $term)
                    ->orWhere('perihal', 'like', $term)
                    ->orWhere('asal', 'like', $term));
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                if ($request->input('status') === 'diarsipkan') {
                    return $q->whereNotNull('archived_at');
                }

                return $q->where('status', $request->input('status'))
                    ->whereNull('archived_at');
            })
            ->when($request->filled('klasifikasi_id'), fn ($q) => $q->where('klasifikasi_id', $request->input('klasifikasi_id')))
            ->when($request->filled('sifat'), fn ($q) => $q->where('sifat', $request->input('sifat')))
            ->latest();

        return Inertia::render('surat-masuk/index', [
            'surat' => $query->paginate(10)->withQueryString()->through(fn (SuratMasuk $s) => $this->map($s)),
            'filters' => $filters,
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
            'statusCounts' => [
                'semua' => SuratMasuk::whereNull('archived_at')->count(),
                'diterima' => SuratMasuk::where('status', 'diterima')->whereNull('archived_at')->count(),
                'diproses' => SuratMasuk::where('status', 'diproses')->whereNull('archived_at')->count(),
                'selesai' => SuratMasuk::where('status', 'selesai')->whereNull('archived_at')->count(),
                'diarsipkan' => SuratMasuk::whereNotNull('archived_at')->count(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('surat-masuk/create', [
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $data['nomor_agenda'] = $this->generateNomorAgenda();
        $data['user_id'] = $request->user()->id;
        $data['unit_id'] = $request->user()->unit_id;
        $data['archived_at'] = $data['status'] === 'selesai' ? now() : null;

        unset($data['lampiran']);

        if ($request->hasFile('lampiran')) {
            $data['lampiran'] = StoreUpload::public($request->file('lampiran'), 'lampiran/surat-masuk');
        }

        $surat = SuratMasuk::create($data);

        User::query()
            ->where('unit_id', $request->user()->unit_id)
            ->whereIn('role', [User::ROLE_PIMPINAN, User::ROLE_ADMIN])
            ->where('id', '!=', $request->user()->id)
            ->get()
            ->each(fn (User $user) => $user->notify(new AppNotification(
                'Surat Masuk Baru',
                'Surat dari '.$surat->asal.' dengan perihal "'.$surat->perihal.'" telah dicatat.',
                route('surat-masuk.show', $surat),
            )));

        return redirect()->route('surat-masuk.show', $surat)->with('success', 'Surat masuk berhasil disimpan.');
    }

    public function show(Request $request, SuratMasuk $surat): Response
    {
        $surat->load(['klasifikasi', 'user', 'disposisi.dariUser', 'disposisi.kepadaUser']);

        return Inertia::render('surat-masuk/show', [
            'surat' => [
                'id' => $surat->id,
                'nomor_agenda' => $surat->nomor_agenda,
                'tanggal_surat' => $surat->tanggal_surat->format('Y-m-d'),
                'tanggal_diterima' => $surat->tanggal_diterima->format('Y-m-d'),
                'asal' => $surat->asal,
                'perihal' => $surat->perihal,
                'isi' => $surat->isi,
                'sifat' => $surat->sifat,
                'status' => $surat->status,
                'status_label' => $surat->statusLabel(),
                'is_archived' => $surat->isArsip(),
                'lampiran' => $surat->lampiran ? [
                    'url' => url('/storage/'.$surat->lampiran),
                    'nama' => basename($surat->lampiran),
                ] : null,
                'klasifikasi' => $surat->klasifikasi,
                'dicatat_oleh' => $surat->user->name,
                'created_at' => $surat->created_at->format('d M Y H:i'),
                'disposisi' => $surat->disposisi->map(fn ($d) => [
                    'id' => $d->id,
                    'dari' => $d->dariUser->name,
                    'kepada' => $d->kepadaUser->name,
                    'catatan' => $d->catatan,
                    'sifat' => $d->sifat,
                    'batas_waktu' => $d->batas_waktu?->format('d M Y'),
                    'status' => $d->status,
                    'status_label' => $d->statusLabel(),
                    'created_at' => $d->created_at->format('d M Y H:i'),
                ]),
            ],
            'petugas' => User::query()
                ->where('unit_id', $request->user()->unit_id)
                ->whereIn('role', [User::ROLE_PIMPINAN, User::ROLE_STAF])
                ->orderBy('name')
                ->get(['id', 'name', 'role', 'jabatan']),
            'canDisposisi' => $request->user()->hasRole(User::ROLE_ADMIN, User::ROLE_PIMPINAN),
        ]);
    }

    public function edit(Request $request, SuratMasuk $surat): Response
    {
        $this->authorizeSurat($request, $surat);

        return Inertia::render('surat-masuk/edit', [
            'surat' => [
                ...$surat->only([
                    'id', 'asal', 'perihal', 'isi', 'sifat', 'status',
                ]),
                'nomor_agenda' => $surat->nomor_agenda,
                'tanggal_surat' => $surat->tanggal_surat->format('Y-m-d'),
                'tanggal_diterima' => $surat->tanggal_diterima->format('Y-m-d'),
                'klasifikasi_id' => $surat->klasifikasi_id,
                'lampiran' => $surat->lampiran ? [
                    'url' => url('/storage/'.$surat->lampiran),
                    'nama' => basename($surat->lampiran),
                ] : null,
            ],
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
        ]);
    }

    public function update(Request $request, SuratMasuk $surat): RedirectResponse
    {
        $this->authorizeSurat($request, $surat);

        $data = $this->validated($request);
        $data['status'] = $request->input('status', $surat->status);
        $data['archived_at'] = $data['status'] === 'selesai'
            ? ($surat->archived_at ?? now())
            : null;

        unset($data['lampiran']);

        if ($request->hasFile('lampiran')) {
            if ($surat->lampiran) {
                Storage::disk('public')->delete($surat->lampiran);
            }
            $data['lampiran'] = StoreUpload::public($request->file('lampiran'), 'lampiran/surat-masuk');
        }

        $surat->update($data);

        return redirect()->route('surat-masuk.show', $surat)->with('success', 'Surat masuk berhasil diperbarui.');
    }

    public function destroy(Request $request, SuratMasuk $surat): RedirectResponse
    {
        $this->authorizeSurat($request, $surat);

        if ($surat->lampiran) {
            Storage::disk('public')->delete($surat->lampiran);
        }

        $surat->delete();

        return redirect()->route('surat-masuk.index')->with('success', 'Surat masuk berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'tanggal_surat' => ['required', 'date'],
            'tanggal_diterima' => ['required', 'date', 'after_or_equal:tanggal_surat'],
            'asal' => ['required', 'string', 'max:255'],
            'perihal' => ['required', 'string', 'max:255'],
            'isi' => ['nullable', 'string'],
            'klasifikasi_id' => [
                'required',
                Rule::exists('klasifikasi_surat', 'id')->where('unit_id', $request->user()->unit_id),
            ],
            'sifat' => ['required', Rule::in(['biasa', 'penting', 'segera'])],
            'status' => ['nullable', Rule::in(['diterima', 'diproses', 'selesai'])],
            'lampiran' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx', 'max:5120'],
        ]) + ['status' => $request->input('status', 'diterima')];
    }

    private function generateNomorAgenda(): string
    {
        $year = now()->year;
        $sequence = SuratMasuk::whereYear('created_at', $year)->count() + 1;

        return sprintf('SM/%d/%03d', $year, $sequence);
    }

    private function authorizeSurat(Request $request, SuratMasuk $surat): void
    {
        $user = $request->user();

        abort_unless($user->isAdmin(), 403, 'Hanya admin yang dapat mengubah surat ini.');
    }

    private function map(SuratMasuk $s): array
    {
        return [
            'id' => $s->id,
            'nomor_agenda' => $s->nomor_agenda,
            'tanggal_surat' => $s->tanggal_surat->format('d M Y'),
            'tanggal_diterima' => $s->tanggal_diterima->format('d M Y'),
            'asal' => $s->asal,
            'perihal' => $s->perihal,
            'sifat' => $s->sifat,
            'status' => $s->status,
            'status_label' => $s->statusLabel(),
            'klasifikasi' => $s->klasifikasi?->nama,
            'dicatat_oleh' => $s->user?->name,
        ];
    }
}
