<?php

namespace App\Http\Controllers;

use App\Models\KlasifikasiSurat;
use App\Models\PengajuanSurat;
use App\Models\SuratKeluar;
use App\Models\SuratMasuk;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArsipController extends Controller
{
    public function index(Request $request): Response
    {
        $jenis = $request->input('jenis', 'surat_masuk');
        abort_unless(in_array($jenis, ['surat_masuk', 'surat_keluar', 'pengajuan'], true), 404);

        $filters = ['q' => $request->input('q'), 'jenis' => $jenis, 'klasifikasi_id' => $request->input('klasifikasi_id')];

        if ($jenis === 'surat_keluar') {
            $arsip = SuratKeluar::with(['klasifikasi', 'user'])
                ->whereNotNull('archived_at')
                ->when($request->filled('q'), function ($q) use ($request) {
                    $term = '%'.$request->input('q').'%';

                    return $q->where(fn ($w) => $w
                        ->where('nomor_surat', 'like', $term)
                        ->orWhere('perihal', 'like', $term)
                        ->orWhere('tujuan', 'like', $term));
                })
                ->when($request->filled('klasifikasi_id'), fn ($q) => $q->where('klasifikasi_id', $request->input('klasifikasi_id')))
                ->latest()
                ->paginate(10)
                ->withQueryString()
                ->through(fn (SuratKeluar $s) => [
                    'id' => $s->id,
                    'nomor' => $s->nomor_surat,
                    'tanggal' => $s->tanggal_surat->format('d M Y'),
                    'perihal' => $s->perihal,
                    'pihak' => $s->tujuan,
                    'klasifikasi' => $s->klasifikasi?->nama,
                    'dicatat_oleh' => $s->user?->name,
                    'detail_url' => route('surat-keluar.show', $s),
                ]);
        } elseif ($jenis === 'surat_masuk') {
            $arsip = SuratMasuk::with(['klasifikasi', 'user'])
                ->whereNotNull('archived_at')
                ->when($request->filled('q'), function ($q) use ($request) {
                    $term = '%'.$request->input('q').'%';

                    return $q->where(fn ($w) => $w
                        ->where('nomor_agenda', 'like', $term)
                        ->orWhere('perihal', 'like', $term)
                        ->orWhere('asal', 'like', $term));
                })
                ->when($request->filled('klasifikasi_id'), fn ($q) => $q->where('klasifikasi_id', $request->input('klasifikasi_id')))
                ->latest()
                ->paginate(10)
                ->withQueryString()
                ->through(fn (SuratMasuk $s) => [
                    'id' => $s->id,
                    'nomor' => $s->nomor_agenda,
                    'tanggal' => $s->tanggal_diterima->format('d M Y'),
                    'perihal' => $s->perihal,
                    'pihak' => $s->asal,
                    'klasifikasi' => $s->klasifikasi?->nama,
                    'dicatat_oleh' => $s->user?->name,
                    'detail_url' => route('surat-masuk.show', $s),
                ]);
        } else {
            $arsip = PengajuanSurat::with(['klasifikasi', 'pengaju'])
                ->whereNotNull('archived_at')
                ->when($request->filled('q'), function ($q) use ($request) {
                    $term = '%'.$request->input('q').'%';

                    return $q->where(fn ($w) => $w
                        ->where('nomor_pengajuan', 'like', $term)
                        ->orWhere('perihal', 'like', $term)
                        ->orWhere('tujuan', 'like', $term)
                        ->orWhereHas('pengaju', fn ($p) => $p->where('name', 'like', $term)));
                })
                ->when($request->filled('klasifikasi_id'), fn ($q) => $q->where('klasifikasi_id', $request->input('klasifikasi_id')))
                ->latest()
                ->paginate(10)
                ->withQueryString()
                ->through(fn (PengajuanSurat $p) => [
                    'id' => $p->id,
                    'nomor' => $p->nomor_pengajuan,
                    'tanggal' => ($p->diajukan_at ?? $p->created_at)->format('d M Y'),
                    'perihal' => $p->perihal,
                    'pihak' => $p->tujuan,
                    'klasifikasi' => $p->klasifikasi?->nama,
                    'dicatat_oleh' => $p->pengaju?->name,
                    'detail_url' => route('pengajuan.show', $p),
                ]);
        }

        return Inertia::render('arsip/index', [
            'arsip' => $arsip,
            'filters' => $filters,
            'klasifikasi' => KlasifikasiSurat::orderBy('kode')->get(['id', 'kode', 'nama']),
            'jumlahArsip' => [
                'surat_masuk' => SuratMasuk::whereNotNull('archived_at')->count(),
                'surat_keluar' => SuratKeluar::whereNotNull('archived_at')->count(),
                'pengajuan' => PengajuanSurat::whereNotNull('archived_at')->count(),
            ],
        ]);
    }

    public function toggle(Request $request, string $jenis, int $id): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->isAdmin(), 403, 'Hanya admin yang dapat mengubah arsip surat.');
        abort_unless(in_array($jenis, ['surat_masuk', 'surat_keluar', 'pengajuan'], true), 404);

        $surat = match ($jenis) {
            'surat_keluar' => SuratKeluar::findOrFail($id),
            'pengajuan' => PengajuanSurat::findOrFail($id),
            default => SuratMasuk::findOrFail($id),
        };

        abort_unless($surat->isArsip(), 422, 'Hanya dokumen yang sudah diarsipkan yang dapat dipulihkan.');

        $surat->update(['archived_at' => null]);
        $pesan = 'Dokumen berhasil dikeluarkan dari arsip.';

        return back()->with('success', $pesan);
    }
}
