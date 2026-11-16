<?php

namespace App\Http\Controllers;

use App\Models\KlasifikasiSurat;
use App\Support\StoreUpload;
use App\Models\Pengaturan;
use App\Models\SuratKeluar;
use App\Models\TemplateSurat;
use App\Models\User;
use App\Notifications\AppNotification;
use App\Support\TemplateContent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

class SuratKeluarController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'status', 'klasifikasi_id', 'sifat']);

        $query = SuratKeluar::with(['klasifikasi', 'user'])
            ->when(
                ! $request->filled('status'),
                fn ($q) => $q->whereNull('archived_at'),
            )
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->input('q').'%';

                return $q->where(fn ($w) => $w
                    ->where('nomor_surat', 'like', $term)
                    ->orWhere('perihal', 'like', $term)
                    ->orWhere('tujuan', 'like', $term));
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

        return Inertia::render('surat-keluar/index', [
            'surat' => $query->paginate(10)->withQueryString()->through(fn (SuratKeluar $s) => $this->map($s)),
            'filters' => $filters,
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
            'statusCounts' => [
                'semua' => SuratKeluar::whereNull('archived_at')->count(),
                'draft' => SuratKeluar::where('status', 'draft')->whereNull('archived_at')->count(),
                'dikirim' => SuratKeluar::where('status', 'dikirim')->whereNull('archived_at')->count(),
                'diterima' => SuratKeluar::where('status', 'diterima')->whereNull('archived_at')->count(),
                'diarsipkan' => SuratKeluar::whereNotNull('archived_at')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        $pengaturan = Pengaturan::current();

        return Inertia::render('surat-keluar/create', [
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
            'templates' => TemplateSurat::options(),
            'defaults' => [
                'template' => 'umum',
                'tempat_surat' => $pengaturan->kota,
                'penandatangan_nama' => $pengaturan->nama_pimpinan,
                'penandatangan_jabatan' => $pengaturan->jabatan_pimpinan,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $pengaturan = Pengaturan::current();

        $data['template'] = ($data['template'] ?? null) ?: 'umum';
        $data['tempat_surat'] = ($data['tempat_surat'] ?? null) ?: $pengaturan->kota;
        $data['penandatangan_nama'] = ($data['penandatangan_nama'] ?? null) ?: $pengaturan->nama_pimpinan;
        $data['penandatangan_jabatan'] = ($data['penandatangan_jabatan'] ?? null) ?: $pengaturan->jabatan_pimpinan;
        $data = $this->renderTemplateBody($data, $pengaturan);

        $klasifikasi = KlasifikasiSurat::findOrFail($data['klasifikasi_id']);

        $data['nomor_surat'] = $this->generateNomorSurat($klasifikasi);
        $data['user_id'] = $request->user()->id;
        $data['status'] = $data['status'] ?? 'draft';
        $data['unit_id'] = $request->user()->unit_id;
        $data['archived_at'] = $data['status'] === 'dikirim' ? now() : null;

        unset($data['lampiran']);

        if ($request->hasFile('lampiran')) {
            $data['lampiran'] = StoreUpload::public($request->file('lampiran'), 'lampiran/surat-keluar');
        }

        $surat = SuratKeluar::create($data);

        User::query()
            ->where('unit_id', $request->user()->unit_id)
            ->whereIn('role', [User::ROLE_PIMPINAN, User::ROLE_ADMIN])
            ->where('id', '!=', $request->user()->id)
            ->get()
            ->each(fn (User $user) => $user->notify(new AppNotification(
                'Surat Keluar Baru',
                'Surat keluar "'.$surat->perihal.'" untuk '.$surat->tujuan.' telah dibuat.',
                route('surat-keluar.show', $surat),
            )));

        return redirect()->route('surat-keluar.show', $surat)->with('success', 'Surat keluar berhasil disimpan.');
    }

    public function show(Request $request, SuratKeluar $surat): Response
    {
        $surat->load(['klasifikasi', 'user', 'pengajuan.pengaju']);

        return Inertia::render('surat-keluar/show', [
            'surat' => [
                'id' => $surat->id,
                'nomor_surat' => $surat->nomor_surat,
                'tanggal_surat' => $surat->tanggal_surat->format('Y-m-d'),
                'tempat_surat' => $surat->tempat_surat,
                'tujuan' => $surat->tujuan,
                'perihal' => $surat->perihal,
                'jumlah_lampiran' => $surat->jumlah_lampiran,
                'isi' => TemplateContent::sanitize((string) $surat->isi),
                'template' => $surat->template,
                'template_label' => $surat->templateLabel(),
                'sifat' => $surat->sifat,
                'status' => $surat->status,
                'status_label' => $surat->statusLabel(),
                'is_archived' => $surat->isArsip(),
                'penandatangan_nama' => $surat->penandatangan_nama,
                'penandatangan_jabatan' => $surat->penandatangan_jabatan,
                'tembusan' => $surat->tembusan,
                'lampiran' => $surat->lampiran ? [
                    'url' => url('/storage/'.$surat->lampiran),
                    'nama' => basename($surat->lampiran),
                ] : null,
                'klasifikasi' => $surat->klasifikasi,
                'dicatat_oleh' => $surat->user->name,
                'created_at' => $surat->created_at->format('d M Y H:i'),
                'pengajuan' => $surat->pengajuan ? [
                    'id' => $surat->pengajuan->id,
                    'nomor_pengajuan' => $surat->pengajuan->nomor_pengajuan,
                    'pengaju' => $surat->pengajuan->pengaju?->name,
                ] : null,
            ],
        ]);
    }

    public function cetak(SuratKeluar $surat): View
    {
        $surat->load(['klasifikasi', 'user', 'pengajuan.pengaju']);
        $pengaturan = Pengaturan::current();

        return view('surat.cetak', [
            'surat' => $surat,
            'isiHtml' => TemplateContent::sanitize((string) $surat->isi),
            'pengaturan' => $pengaturan,
            'logoUrl' => $pengaturan->logo ? url('/storage/'.$pengaturan->logo) : null,
        ]);
    }

    public function edit(Request $request, SuratKeluar $surat): Response
    {
        $this->authorizeSurat($request, $surat);

        return Inertia::render('surat-keluar/edit', [
            'surat' => [
                ...$surat->only([
                    'id',
                    'nomor_surat',
                    'tempat_surat',
                    'tujuan',
                    'perihal',
                    'jumlah_lampiran',
                    'template',
                    'sifat',
                    'status',
                    'penandatangan_nama',
                    'penandatangan_jabatan',
                    'tembusan',
                ]),
                'tanggal_surat' => $surat->tanggal_surat->format('Y-m-d'),
                'klasifikasi_id' => $surat->klasifikasi_id,
                'details' => $surat->template_data ?? [],
                'lampiran' => $surat->lampiran ? [
                    'url' => url('/storage/'.$surat->lampiran),
                    'nama' => basename($surat->lampiran),
                ] : null,
            ],
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
            'templates' => TemplateSurat::options(false),
        ]);
    }

    public function update(Request $request, SuratKeluar $surat): RedirectResponse
    {
        $this->authorizeSurat($request, $surat);

        $data = $this->validated($request);
        $data['archived_at'] = ($data['status'] ?? $surat->status) === 'dikirim'
            ? ($surat->archived_at ?? now())
            : null;
        $pengaturan = Pengaturan::current();

        $data['template'] = ($data['template'] ?? null) ?: $surat->template;
        $data['tempat_surat'] = ($data['tempat_surat'] ?? null) ?: $pengaturan->kota;
        $data['penandatangan_nama'] = ($data['penandatangan_nama'] ?? null) ?: $pengaturan->nama_pimpinan;
        $data['penandatangan_jabatan'] = ($data['penandatangan_jabatan'] ?? null) ?: $pengaturan->jabatan_pimpinan;
        $data['status'] = $data['status'] ?? $surat->status;
        $data = $this->renderTemplateBody($data, $pengaturan, $surat);

        unset($data['lampiran']);

        if ($request->hasFile('lampiran')) {
            if ($surat->lampiran) {
                Storage::disk('public')->delete($surat->lampiran);
            }
            $data['lampiran'] = StoreUpload::public($request->file('lampiran'), 'lampiran/surat-keluar');
        }

        $surat->update($data);

        return redirect()->route('surat-keluar.show', $surat)->with('success', 'Surat keluar berhasil diperbarui.');
    }

    public function destroy(Request $request, SuratKeluar $surat): RedirectResponse
    {
        $this->authorizeSurat($request, $surat);

        if ($surat->lampiran) {
            Storage::disk('public')->delete($surat->lampiran);
        }

        $surat->delete();

        return redirect()->route('surat-keluar.index')->with('success', 'Surat keluar berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'tanggal_surat' => ['required', 'date'],
            'tempat_surat' => ['nullable', 'string', 'max:100'],
            'tujuan' => ['required', 'string', 'max:255'],
            'perihal' => ['required', 'string', 'max:255'],
            'jumlah_lampiran' => ['nullable', 'string', 'max:50'],
            'template' => ['nullable', Rule::exists('template_surat', 'slug')],
            'details' => ['nullable', 'array'],
            'details.*' => ['nullable', 'string', 'max:2000'],
            'klasifikasi_id' => [
                'required',
                Rule::exists('klasifikasi_surat', 'id')->where('unit_id', $request->user()->unit_id),
            ],
            'sifat' => ['required', Rule::in(['biasa', 'penting', 'segera'])],
            'status' => ['nullable', Rule::in(['draft', 'dikirim', 'diterima'])],
            'penandatangan_nama' => ['nullable', 'string', 'max:255'],
            'penandatangan_jabatan' => ['nullable', 'string', 'max:255'],
            'tembusan' => ['nullable', 'string', 'max:2000'],
            'lampiran' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx', 'max:5120'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function renderTemplateBody(array $data, Pengaturan $pengaturan, ?SuratKeluar $existing = null): array
    {
        $details = $data['details'] ?? $existing?->template_data ?? [];
        unset($data['details']);

        $details = collect($details)
            ->filter(fn ($value) => is_scalar($value))
            ->map(fn ($value) => (string) $value)
            ->all();

        $context = [
            'perihal' => $data['perihal'] ?? '',
            'tujuan' => $data['tujuan'] ?? '',
            'tanggal' => isset($data['tanggal_surat'])
                ? Carbon::parse($data['tanggal_surat'])->translatedFormat('d F Y')
                : '',
            'tempat' => ($data['tempat_surat'] ?? null) ?: $pengaturan->kota,
            ...$details,
        ];

        $data['isi'] = TemplateSurat::render($data['template'] ?? 'umum', $context);
        $data['template_data'] = $details;

        return $data;
    }

    private function generateNomorSurat(KlasifikasiSurat $klasifikasi): string
    {
        $year = now()->year;
        $sequence = SuratKeluar::whereYear('created_at', $year)->count() + 1;

        return sprintf('%03d/%s/%d', $sequence, $klasifikasi->kode, $year);
    }

    private function authorizeSurat(Request $request, SuratKeluar $surat): void
    {
        $user = $request->user();

        abort_unless($user->isAdmin(), 403, 'Hanya admin yang dapat mengubah surat ini.');
    }

    private function map(SuratKeluar $s): array
    {
        return [
            'id' => $s->id,
            'nomor_surat' => $s->nomor_surat,
            'tanggal_surat' => $s->tanggal_surat->format('d M Y'),
            'tujuan' => $s->tujuan,
            'perihal' => $s->perihal,
            'sifat' => $s->sifat,
            'status' => $s->status,
            'status_label' => $s->statusLabel(),
            'klasifikasi' => $s->klasifikasi?->nama,
            'dicatat_oleh' => $s->user?->name,
        ];
    }
}
