<?php

namespace App\Http\Controllers;

use App\Models\KlasifikasiSurat;
use App\Support\StoreUpload;
use App\Models\PengajuanSurat;
use App\Models\Pengaturan;
use App\Models\SuratKeluar;
use App\Models\TemplateSurat;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PengajuanSuratController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $config = $this->tabConfig($user);
        $tab = (string) $request->input('tab', $config['default']);

        if (! in_array($tab, $config['tabs'], true)) {
            $tab = $config['default'];
        }

        $query = PengajuanSurat::query()
            ->with(['klasifikasi', 'pengaju', 'pemeriksa'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->input('q').'%';

                return $q->where(fn ($w) => $w
                    ->where('nomor_pengajuan', 'like', $term)
                    ->orWhere('perihal', 'like', $term)
                    ->orWhere('tujuan', 'like', $term)
                    ->orWhereHas('pengaju', fn ($p) => $p->where('name', 'like', $term)));
            });

        if ($user->isStaf()) {
            $query->where('pengaju_id', $user->id);
        } elseif ($user->isPimpinan()) {
            if ($tab === 'periksa') {
                $query->where('status', PengajuanSurat::STATUS_MENUNGGU_PEMERIKSAAN);
            } else {
                $query->where('pengaju_id', $user->id);
            }
        } elseif ($tab !== 'semua') {
            $query->where('status', $tab);
        }

        return Inertia::render('pengajuan/index', [
            'pengajuan' => $query->latest()
                ->paginate(10)
                ->withQueryString()
                ->through(fn (PengajuanSurat $p) => [
                    ...$this->map($p),
                    'can_edit' => $user->isAdmin() || ($p->pengaju_id === $user->id && $p->isEditable()),
                    'can_delete' => ($user->isAdmin() || ($p->pengaju_id === $user->id && $p->isEditable())) && $p->canBeDeleted(),
                    'can_review' => $user->isPimpinan() && $p->canBeReviewed(),
                ]),
            'filters' => $request->only(['q', 'tab']),
            'tabs' => $config['tabs'],
            'tabLabels' => $config['labels'],
            'tab' => $tab,
            'tabCounts' => $this->tabCounts($user),
            'role' => $user->role,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('pengajuan/create', [
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $data['nomor_pengajuan'] = $this->generateNomorPengajuan();
        $data['pengaju_id'] = $request->user()->id;
        $data['unit_id'] = $request->user()->unit_id;
        $data['status'] = PengajuanSurat::STATUS_DIAJUKAN;
        $data['diajukan_at'] = now();

        unset($data['lampiran']);

        if ($request->hasFile('lampiran')) {
            $data['lampiran'] = StoreUpload::public($request->file('lampiran'), 'lampiran/pengajuan');
        }

        $pengajuan = PengajuanSurat::create($data);

        $this->notifyAdmins(
            'Pengajuan Dokumen Baru',
            $request->user()->name.' mengajukan dokumen "'.$pengajuan->perihal.'" untuk '.$pengajuan->tujuan.'.',
            route('pengajuan.show', $pengajuan),
        );

        return redirect()->route('pengajuan.show', $pengajuan)
            ->with('success', 'Pengajuan dokumen berhasil dikirim. Menunggu diproses admin.');
    }

    public function show(Request $request, PengajuanSurat $pengajuan): Response
    {
        $this->authorizeView($request, $pengajuan);

        $user = $request->user();
        $pengajuan->load(['klasifikasi', 'pengaju', 'pemeriksa', 'suratKeluar']);

        $isPengaju = $pengajuan->pengaju_id === $user->id;

        return Inertia::render('pengajuan/show', [
            'pengajuan' => [
                'id' => $pengajuan->id,
                'nomor_pengajuan' => $pengajuan->nomor_pengajuan,
                'tujuan' => $pengajuan->tujuan,
                'perihal' => $pengajuan->perihal,
                'isi' => $pengajuan->isi,
                'sifat' => $pengajuan->sifat,
                'status' => $pengajuan->status,
                'status_label' => $pengajuan->statusLabel(),
                'catatan_pengaju' => $pengajuan->catatan_pengaju,
                'catatan_admin' => $pengajuan->catatan_admin,
                'catatan_pemeriksa' => $pengajuan->catatan_pemeriksa,
                'klasifikasi' => $pengajuan->klasifikasi,
                'pengaju' => [
                    'name' => $pengajuan->pengaju->name,
                    'jabatan' => $pengajuan->pengaju->jabatan,
                    'role_label' => $pengajuan->pengaju->roleLabel(),
                ],
                'pemeriksa' => $pengajuan->pemeriksa?->name,
                'surat_keluar' => $pengajuan->suratKeluar ? [
                    'id' => $pengajuan->suratKeluar->id,
                    'nomor_surat' => $pengajuan->suratKeluar->nomor_surat,
                    'status' => $pengajuan->suratKeluar->status,
                    'status_label' => $pengajuan->suratKeluar->statusLabel(),
                    'tanggal_surat' => $pengajuan->suratKeluar->tanggal_surat->format('d M Y'),
                ] : null,
                'lampiran' => $pengajuan->lampiran ? [
                    'url' => url('/storage/'.$pengajuan->lampiran),
                    'nama' => basename($pengajuan->lampiran),
                ] : null,
                'created_at' => $pengajuan->created_at->format('d M Y H:i'),
                'diajukan_at' => $pengajuan->diajukan_at?->format('d M Y H:i'),
                'diperiksa_at' => $pengajuan->diperiksa_at?->format('d M Y H:i'),
            ],
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
            'templates' => TemplateSurat::options(),
            'can' => [
                'edit' => $user->isAdmin() || ($isPengaju && $pengajuan->isEditable()),
                'delete' => ($user->isAdmin() || ($isPengaju && $pengajuan->isEditable())) && $pengajuan->canBeDeleted(),
                'process' => $user->isAdmin() && in_array($pengajuan->status, [
                    PengajuanSurat::STATUS_DIAJUKAN,
                    PengajuanSurat::STATUS_DIPROSES,
                    PengajuanSurat::STATUS_REVISI,
                ], true),
                'review' => $user->isPimpinan() && $pengajuan->canBeReviewed(),
                'finalize' => $user->isAdmin() && $pengajuan->canBeFinalized(),
            ],
            'role' => $user->role,
        ]);
    }

    public function edit(Request $request, PengajuanSurat $pengajuan): Response
    {
        $this->authorizePengaju($request, $pengajuan);

        return Inertia::render('pengajuan/edit', [
            'pengajuan' => [
                'id' => $pengajuan->id,
                'nomor_pengajuan' => $pengajuan->nomor_pengajuan,
                'tujuan' => $pengajuan->tujuan,
                'perihal' => $pengajuan->perihal,
                'isi' => $pengajuan->isi,
                'sifat' => $pengajuan->sifat,
                'klasifikasi_id' => $pengajuan->klasifikasi_id,
                'catatan_pengaju' => $pengajuan->catatan_pengaju,
                'lampiran' => $pengajuan->lampiran ? [
                    'url' => url('/storage/'.$pengajuan->lampiran),
                    'nama' => basename($pengajuan->lampiran),
                ] : null,
            ],
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
        ]);
    }

    public function update(Request $request, PengajuanSurat $pengajuan): RedirectResponse
    {
        $this->authorizePengaju($request, $pengajuan);

        $data = $this->validated($request);

        unset($data['lampiran']);

        if ($request->hasFile('lampiran')) {
            if ($pengajuan->lampiran) {
                Storage::disk('public')->delete($pengajuan->lampiran);
            }
            $data['lampiran'] = StoreUpload::public($request->file('lampiran'), 'lampiran/pengajuan');
        }

        if ($pengajuan->status === PengajuanSurat::STATUS_REVISI) {
            $data['status'] = PengajuanSurat::STATUS_DIAJUKAN;
            $data['archived_at'] = null;
            $data['pemeriksa_id'] = null;
            $data['diperiksa_at'] = null;
            $data['diajukan_at'] = now();
        }

        $pengajuan->update($data);

        if ($data['status'] ?? null) {
            $this->notifyAdmins(
                'Pengajuan Dokumen Diperbarui',
                $request->user()->name.' memperbarui pengajuan "'.$pengajuan->perihal.'".',
                route('pengajuan.show', $pengajuan),
            );
        }

        return redirect()->route('pengajuan.show', $pengajuan)
            ->with('success', 'Pengajuan dokumen berhasil diperbarui.');
    }

    public function destroy(Request $request, PengajuanSurat $pengajuan): RedirectResponse
    {
        $this->authorizePengaju($request, $pengajuan);

        abort_unless($pengajuan->canBeDeleted(), 422, 'Pengajuan yang sudah memiliki dokumen surat keluar tidak dapat dihapus.');

        if ($pengajuan->lampiran) {
            Storage::disk('public')->delete($pengajuan->lampiran);
        }

        $pengajuan->delete();

        return redirect()->route('pengajuan.index')
            ->with('success', 'Pengajuan dokumen berhasil dihapus.');
    }

    public function storeDocument(Request $request, PengajuanSurat $pengajuan): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Hanya admin yang dapat membuat dokumen.');
        abort_unless(in_array($pengajuan->status, [
            PengajuanSurat::STATUS_DIAJUKAN,
            PengajuanSurat::STATUS_DIPROSES,
            PengajuanSurat::STATUS_REVISI,
        ], true), 422, 'Pengajuan ini tidak dapat diproses pada status saat ini.');

        $data = $request->validate([
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
            'catatan_admin' => ['nullable', 'string', 'max:1000'],
            'penandatangan_nama' => ['nullable', 'string', 'max:255'],
            'penandatangan_jabatan' => ['nullable', 'string', 'max:255'],
            'tembusan' => ['nullable', 'string', 'max:2000'],
            'lampiran' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx', 'max:5120'],
        ]);

        $klasifikasi = KlasifikasiSurat::findOrFail($data['klasifikasi_id']);
        $pengaturan = Pengaturan::current();
        $suratKeluar = $pengajuan->suratKeluar;
        $letterData = [
            'template' => ($data['template'] ?? null) ?: ($suratKeluar?->template ?? 'umum'),
            'tempat_surat' => ($data['tempat_surat'] ?? null) ?: ($suratKeluar?->tempat_surat ?? $pengaturan->kota),
            'jumlah_lampiran' => ($data['jumlah_lampiran'] ?? null) ?: $suratKeluar?->jumlah_lampiran,
            'penandatangan_nama' => ($data['penandatangan_nama'] ?? null) ?: ($suratKeluar?->penandatangan_nama ?? $pengaturan->nama_pimpinan),
            'penandatangan_jabatan' => ($data['penandatangan_jabatan'] ?? null) ?: ($suratKeluar?->penandatangan_jabatan ?? $pengaturan->jabatan_pimpinan),
            'tembusan' => ($data['tembusan'] ?? null) ?: $suratKeluar?->tembusan,
        ];

        $details = collect($data['details'] ?? $suratKeluar?->template_data ?? [])
            ->filter(fn ($value) => is_scalar($value))
            ->map(fn ($value) => (string) $value)
            ->all();

        $context = [
            'perihal' => $data['perihal'],
            'tujuan' => $data['tujuan'],
            'tanggal' => Carbon::parse($data['tanggal_surat'])->translatedFormat('d F Y'),
            'tempat' => $letterData['tempat_surat'],
            ...$details,
        ];

        $letterData['isi'] = TemplateSurat::render($letterData['template'], $context);
        $letterData['template_data'] = $details;
        $lampiran = null;

        if ($request->hasFile('lampiran')) {
            $lampiran = StoreUpload::public($request->file('lampiran'), 'lampiran/surat-keluar');
        } elseif ($pengajuan->lampiran) {
            $lampiran = 'lampiran/surat-keluar/'.uniqid('salinan-', true).'/'.basename($pengajuan->lampiran);
            Storage::disk('public')->copy($pengajuan->lampiran, $lampiran);
        }

        if ($suratKeluar) {
            if ($lampiran && $suratKeluar->lampiran) {
                Storage::disk('public')->delete($suratKeluar->lampiran);
            }

            $suratKeluar->update([
                'tanggal_surat' => $data['tanggal_surat'],
                'tujuan' => $data['tujuan'],
                'perihal' => $data['perihal'],
                'klasifikasi_id' => $data['klasifikasi_id'],
                'sifat' => $data['sifat'],
                ...$letterData,
                ...($lampiran ? ['lampiran' => $lampiran] : []),
            ]);
        } else {
            $suratKeluar = SuratKeluar::create([
                'nomor_surat' => $this->generateNomorSurat($klasifikasi),
                'tanggal_surat' => $data['tanggal_surat'],
                'tujuan' => $data['tujuan'],
                'perihal' => $data['perihal'],
                'klasifikasi_id' => $data['klasifikasi_id'],
                'sifat' => $data['sifat'],
                'status' => 'draft',
                'lampiran' => $lampiran,
                'user_id' => $request->user()->id,
                'unit_id' => $pengajuan->unit_id,
                ...$letterData,
            ]);
        }

        $pengajuan->update([
            'surat_keluar_id' => $suratKeluar->id,
            'status' => PengajuanSurat::STATUS_MENUNGGU_PEMERIKSAAN,
            'archived_at' => null,
            'catatan_admin' => $data['catatan_admin'] ?? null,
            'pemeriksa_id' => null,
            'diperiksa_at' => null,
        ]);

        $this->notifyRole(
            User::ROLE_PIMPINAN,
            'Dokumen Menunggu Pemeriksaan',
            'Dokumen "'.$pengajuan->perihal.'" ('.$suratKeluar->nomor_surat.') telah dibuat dan menunggu pemeriksaan Anda.',
            route('pengajuan.show', $pengajuan),
        );

        $pengajuan->pengaju->notify(new AppNotification(
            'Dokumen Sedang Diperiksa',
            'Pengajuan "'.$pengajuan->perihal.'" telah dibuat menjadi surat '.$suratKeluar->nomor_surat.' dan menunggu pemeriksaan pimpinan.',
            route('pengajuan.show', $pengajuan),
        ));

        return redirect()->route('pengajuan.show', $pengajuan)
            ->with('success', 'Dokumen berhasil dibuat dan dikirim untuk pemeriksaan pimpinan.');
    }

    public function review(Request $request, PengajuanSurat $pengajuan): RedirectResponse
    {
        abort_unless($request->user()->isPimpinan(), 403, 'Hanya pimpinan yang dapat memeriksa dokumen.');
        abort_unless($pengajuan->canBeReviewed(), 422, 'Pengajuan ini tidak sedang menunggu pemeriksaan.');

        $data = $request->validate([
            'keputusan' => ['required', Rule::in(['setujui', 'revisi', 'tolak'])],
            'catatan_pemeriksa' => ['nullable', 'string', 'max:1000', 'required_if:keputusan,revisi,tolak'],
        ]);

        $status = match ($data['keputusan']) {
            'setujui' => PengajuanSurat::STATUS_DISETUJUI,
            'revisi' => PengajuanSurat::STATUS_REVISI,
            default => PengajuanSurat::STATUS_DITOLAK,
        };

        $pengajuan->update([
            'status' => $status,
            'catatan_pemeriksa' => $data['catatan_pemeriksa'] ?? null,
            'pemeriksa_id' => $request->user()->id,
            'diperiksa_at' => now(),
        ]);

        $pengajuan->pengaju->notify(new AppNotification(
            'Hasil Pemeriksaan Dokumen',
            'Pengajuan "'.$pengajuan->perihal.'" telah diperiksa dengan hasil: '.$pengajuan->statusLabel().'.',
            route('pengajuan.show', $pengajuan),
        ));

        $this->notifyAdmins(
            'Hasil Pemeriksaan Dokumen',
            'Pengajuan "'.$pengajuan->perihal.'" diperiksa oleh '.$request->user()->name.': '.$pengajuan->statusLabel().'.',
            route('pengajuan.show', $pengajuan),
        );

        return redirect()->route('pengajuan.show', $pengajuan)
            ->with('success', 'Hasil pemeriksaan berhasil disimpan: '.$pengajuan->statusLabel().'.');
    }

    public function finalize(Request $request, PengajuanSurat $pengajuan): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403, 'Hanya admin yang dapat menyelesaikan pengajuan.');
        abort_unless($pengajuan->canBeFinalized(), 422, 'Pengajuan belum disetujui pimpinan.');

        $pengajuan->update([
            'status' => PengajuanSurat::STATUS_SELESAI,
            'archived_at' => now(),
        ]);

        $pengajuan->suratKeluar?->update([
            'status' => 'dikirim',
            'archived_at' => now(),
        ]);

        $pengajuan->pengaju->notify(new AppNotification(
            'Pengajuan Selesai',
            'Pengajuan "'.$pengajuan->perihal.'" telah selesai diproses dan dokumen sudah diterbitkan.',
            route('pengajuan.show', $pengajuan),
        ));

        return redirect()->route('pengajuan.show', $pengajuan)
            ->with('success', 'Pengajuan ditandai selesai dan surat keluar telah diterbitkan.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'tujuan' => ['required', 'string', 'max:255'],
            'perihal' => ['required', 'string', 'max:255'],
            'isi' => ['nullable', 'string'],
            'klasifikasi_id' => [
                'required',
                Rule::exists('klasifikasi_surat', 'id')->where('unit_id', $request->user()->unit_id),
            ],
            'sifat' => ['required', Rule::in(['biasa', 'penting', 'segera'])],
            'catatan_pengaju' => ['nullable', 'string', 'max:1000'],
            'lampiran' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx,xls,xlsx', 'max:5120'],
        ]);
    }

    /**
     * @return array{tabs: list<string>, labels: array<string, string>, default: string}
     */
    private function tabConfig(User $user): array
    {
        if ($user->isStaf()) {
            return [
                'tabs' => ['saya'],
                'labels' => ['saya' => 'Pengajuan Saya'],
                'default' => 'saya',
            ];
        }

        if ($user->isPimpinan()) {
            return [
                'tabs' => ['periksa', 'saya'],
                'labels' => ['periksa' => 'Perlu Diperiksa', 'saya' => 'Pengajuan Saya'],
                'default' => 'periksa',
            ];
        }

        return [
            'tabs' => ['semua', 'diajukan', 'diproses', 'menunggu_pemeriksaan', 'revisi', 'disetujui', 'selesai', 'ditolak'],
            'labels' => [
                'semua' => 'Semua',
                'diajukan' => 'Diajukan',
                'diproses' => 'Diproses',
                'menunggu_pemeriksaan' => 'Menunggu Pemeriksaan',
                'revisi' => 'Revisi',
                'disetujui' => 'Disetujui',
                'selesai' => 'Selesai',
                'ditolak' => 'Ditolak',
            ],
            'default' => 'semua',
        ];
    }

    /**
     * @return array<string, int>
     */
    private function tabCounts(User $user): array
    {
        if ($user->isStaf()) {
            return ['saya' => PengajuanSurat::where('pengaju_id', $user->id)->count()];
        }

        if ($user->isPimpinan()) {
            return [
                'periksa' => PengajuanSurat::where('status', PengajuanSurat::STATUS_MENUNGGU_PEMERIKSAAN)->count(),
                'saya' => PengajuanSurat::where('pengaju_id', $user->id)->count(),
            ];
        }

        $counts = ['semua' => PengajuanSurat::count()];

        foreach (['diajukan', 'diproses', 'menunggu_pemeriksaan', 'revisi', 'disetujui', 'selesai', 'ditolak'] as $status) {
            $counts[$status] = PengajuanSurat::where('status', $status)->count();
        }

        return $counts;
    }

    private function generateNomorPengajuan(): string
    {
        $year = now()->year;
        $sequence = PengajuanSurat::whereYear('created_at', $year)->count() + 1;

        do {
            $nomor = sprintf('PGS/%d/%03d', $year, $sequence);
            $sequence++;
        } while (PengajuanSurat::where('nomor_pengajuan', $nomor)->exists());

        return $nomor;
    }

    private function generateNomorSurat(KlasifikasiSurat $klasifikasi): string
    {
        $year = now()->year;
        $sequence = SuratKeluar::whereYear('created_at', $year)->count() + 1;

        do {
            $nomor = sprintf('%03d/%s/%d', $sequence, $klasifikasi->kode, $year);
            $sequence++;
        } while (SuratKeluar::where('nomor_surat', $nomor)->exists());

        return $nomor;
    }

    private function authorizeView(Request $request, PengajuanSurat $pengajuan): void
    {
        $user = $request->user();

        abort_unless(
            $user->isAdmin() || $user->isPimpinan() || $pengajuan->pengaju_id === $user->id,
            403,
            'Anda tidak memiliki akses ke pengajuan ini.',
        );
    }

    private function authorizePengaju(Request $request, PengajuanSurat $pengajuan): void
    {
        $user = $request->user();

        abort_unless(
            $user->isAdmin() || ($pengajuan->pengaju_id === $user->id && $pengajuan->isEditable()),
            403,
            'Anda tidak memiliki akses untuk mengubah pengajuan ini.',
        );
    }

    private function notifyAdmins(string $judul, string $pesan, string $url): void
    {
        $this->notifyRole(User::ROLE_ADMIN, $judul, $pesan, $url);
    }

    private function notifyRole(string $role, string $judul, string $pesan, string $url): void
    {
        User::query()
            ->where('unit_id', auth()->user()->unit_id)
            ->where('role', $role)
            ->get()
            ->each(fn (User $user) => $user->notify(new AppNotification($judul, $pesan, $url)));
    }

    /**
     * @return array<string, mixed>
     */
    private function map(PengajuanSurat $p): array
    {
        return [
            'id' => $p->id,
            'nomor_pengajuan' => $p->nomor_pengajuan,
            'pengaju' => $p->pengaju?->name,
            'tujuan' => $p->tujuan,
            'perihal' => $p->perihal,
            'sifat' => $p->sifat,
            'status' => $p->status,
            'status_label' => $p->statusLabel(),
            'klasifikasi' => $p->klasifikasi?->nama,
            'pemeriksa' => $p->pemeriksa?->name,
            'tanggal' => $p->created_at->format('d M Y'),
        ];
    }
}
