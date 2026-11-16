<?php

namespace App\Http\Controllers;

use App\Models\Disposisi;
use App\Models\PengajuanSurat;
use App\Models\SuratKeluar;
use App\Models\SuratMasuk;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $now = now();

        $bulanLabels = [];
        $masukPerBulan = [];
        $keluarPerBulan = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);

            $bulanLabels[] = $date->translatedFormat('M');
            $masukPerBulan[] = SuratMasuk::query()
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            $keluarPerBulan[] = SuratKeluar::query()
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
        }

        $disposisiSaya = Disposisi::with(['suratMasuk', 'dariUser'])
            ->where('kepada_user_id', $user->id)
            ->whereIn('status', ['pending', 'diproses'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn (Disposisi $d) => [
                'id' => $d->id,
                'perihal' => $d->suratMasuk->perihal,
                'nomor_agenda' => $d->suratMasuk->nomor_agenda,
                'dari' => $d->dariUser->name,
                'catatan' => $d->catatan,
                'sifat' => $d->sifat,
                'status' => $d->status,
                'status_label' => $d->statusLabel(),
                'batas_waktu' => $d->batas_waktu?->format('d M Y'),
                'terlambat' => $d->batas_waktu && $d->batas_waktu->isPast() && $d->status !== 'selesai',
            ]);

        $recentSuratMasuk = SuratMasuk::with(['klasifikasi', 'user'])
            ->whereNull('archived_at')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (SuratMasuk $s) => $this->mapSuratMasuk($s));

        $recentSuratKeluar = SuratKeluar::with(['klasifikasi', 'user'])
            ->whereNull('archived_at')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (SuratKeluar $s) => $this->mapSuratKeluar($s));

        $recentPengajuan = PengajuanSurat::with(['klasifikasi', 'pengaju'])
            ->when($user->isPimpinan(), fn ($q) => $q->where(fn ($w) => $w
                ->where('pengaju_id', $user->id)
                ->orWhere('status', PengajuanSurat::STATUS_MENUNGGU_PEMERIKSAAN)))
            ->when($user->isStaf(), fn ($q) => $q->where('pengaju_id', $user->id))
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (PengajuanSurat $p) => [
                'id' => $p->id,
                'nomor_pengajuan' => $p->nomor_pengajuan,
                'perihal' => $p->perihal,
                'tujuan' => $p->tujuan,
                'pengaju' => $p->pengaju?->name,
                'status' => $p->status,
                'status_label' => $p->statusLabel(),
            ]);

        return Inertia::render('dashboard', [
            'stats' => [
                'surat_masuk' => SuratMasuk::count(),
                'surat_keluar' => SuratKeluar::count(),
                'masuk_bulan_ini' => SuratMasuk::query()
                    ->whereYear('created_at', $now->year)
                    ->whereMonth('created_at', $now->month)
                    ->count(),
                'keluar_bulan_ini' => SuratKeluar::query()
                    ->whereYear('created_at', $now->year)
                    ->whereMonth('created_at', $now->month)
                    ->count(),
                'disposisi_pending' => Disposisi::where('kepada_user_id', $user->id)
                    ->whereIn('status', ['pending', 'diproses'])
                    ->count(),
                'disposisi_selesai' => Disposisi::where('kepada_user_id', $user->id)
                    ->where('status', 'selesai')
                    ->count(),
                'surat_diproses' => SuratMasuk::where('status', 'diproses')->count(),
                'surat_arsip' => SuratMasuk::whereNotNull('archived_at')->count()
                    + SuratKeluar::whereNotNull('archived_at')->count()
                    + PengajuanSurat::whereNotNull('archived_at')->count(),
                'pengajuan_saya' => PengajuanSurat::where('pengaju_id', $user->id)
                    ->whereNotIn('status', [PengajuanSurat::STATUS_SELESAI, PengajuanSurat::STATUS_DITOLAK])
                    ->count(),
                'pengajuan_perlu_tindakan' => match ($user->role) {
                    User::ROLE_ADMIN => PengajuanSurat::whereIn('status', [
                        PengajuanSurat::STATUS_DIAJUKAN,
                        PengajuanSurat::STATUS_DIPROSES,
                        PengajuanSurat::STATUS_REVISI,
                    ])->count(),
                    User::ROLE_PIMPINAN => PengajuanSurat::where('status', PengajuanSurat::STATUS_MENUNGGU_PEMERIKSAAN)->count(),
                    default => PengajuanSurat::where('pengaju_id', $user->id)
                        ->where('status', PengajuanSurat::STATUS_REVISI)
                        ->count(),
                },
            ],
            'chart' => [
                'labels' => $bulanLabels,
                'masuk' => $masukPerBulan,
                'keluar' => $keluarPerBulan,
            ],
            'statusMasuk' => [
                'diterima' => SuratMasuk::where('status', 'diterima')->whereNull('archived_at')->count(),
                'diproses' => SuratMasuk::where('status', 'diproses')->whereNull('archived_at')->count(),
                'selesai' => SuratMasuk::where('status', 'selesai')->whereNull('archived_at')->count(),
                'diarsipkan' => SuratMasuk::whereNotNull('archived_at')->count(),
            ],
            'disposisiSaya' => $disposisiSaya,
            'recentSuratMasuk' => $recentSuratMasuk,
            'recentSuratKeluar' => $recentSuratKeluar,
            'recentPengajuan' => $recentPengajuan,
            'role' => $user->role,
        ]);
    }

    private function mapSuratMasuk(SuratMasuk $s): array
    {
        return [
            'id' => $s->id,
            'nomor_agenda' => $s->nomor_agenda,
            'perihal' => $s->perihal,
            'asal' => $s->asal,
            'tanggal_diterima' => $s->tanggal_diterima->format('d M Y'),
            'status' => $s->status,
            'status_label' => $s->statusLabel(),
            'sifat' => $s->sifat,
            'klasifikasi' => $s->klasifikasi?->nama,
        ];
    }

    private function mapSuratKeluar(SuratKeluar $s): array
    {
        return [
            'id' => $s->id,
            'nomor_surat' => $s->nomor_surat,
            'perihal' => $s->perihal,
            'tujuan' => $s->tujuan,
            'tanggal_surat' => $s->tanggal_surat->format('d M Y'),
            'status' => $s->status,
            'status_label' => $s->statusLabel(),
            'sifat' => $s->sifat,
            'klasifikasi' => $s->klasifikasi?->nama,
        ];
    }
}
