<?php

namespace App\Http\Controllers;

use App\Models\Disposisi;
use App\Models\SuratMasuk;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DisposisiController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tab = $request->input('tab', 'diterima');
        $tabs = ['diterima', 'diberikan'];

        if ($user->isAdmin() && $request->filled('tab') && $request->input('tab') === 'semua') {
            $tabs[] = 'semua';
            $tab = 'semua';
        }

        $query = Disposisi::with(['suratMasuk', 'dariUser', 'kepadaUser'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->input('q').'%';

                return $q->whereHas('suratMasuk', fn ($w) => $w
                    ->where('perihal', 'like', $term)
                    ->orWhere('nomor_agenda', 'like', $term));
            })
            ->latest();

        if ($tab === 'diterima') {
            $query->where('kepada_user_id', $user->id);
        } elseif ($tab === 'diberikan') {
            $query->where('dari_user_id', $user->id);
        }

        $tabCounts = [
            'diterima' => Disposisi::where('kepada_user_id', $user->id)->count(),
            'diberikan' => Disposisi::where('dari_user_id', $user->id)->count(),
        ];

        if ($user->isAdmin()) {
            $tabCounts['semua'] = Disposisi::count();
            $tabs[] = 'semua';
        }

        return Inertia::render('disposisi/index', [
            'disposisi' => $query->paginate(10)->withQueryString()->through(fn (Disposisi $d) => $this->map($d)),
            'tabs' => $tabs,
            'tab' => $tab,
            'tabCounts' => $tabCounts,
            'filters' => $request->only(['q', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'surat_masuk_id' => ['required', 'exists:surat_masuk,id'],
            'kepada_user_id' => [
                'required',
                Rule::exists('users', 'id')->where('unit_id', $request->user()->unit_id),
                'different:dari_user_id',
            ],
            'catatan' => ['required', 'string', 'max:1000'],
            'sifat' => ['required', Rule::in(['biasa', 'penting', 'segera'])],
            'batas_waktu' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $surat = SuratMasuk::with('klasifikasi')->findOrFail($data['surat_masuk_id']);

        abort_if($surat->isArsip(), 422, 'Surat yang sudah diarsipkan tidak dapat didisposisikan.');

        $disposisi = Disposisi::create([
            ...$data,
            'dari_user_id' => $request->user()->id,
        ]);

        $target = User::where('unit_id', $request->user()->unit_id)->findOrFail($data['kepada_user_id']);
        $target->notify(new AppNotification(
            'Disposisi Baru',
            $request->user()->name.' memberikan disposisi: "'.$disposisi->catatan.'" (surat: '.$surat->perihal.')',
            route('disposisi.index', ['tab' => 'diterima']),
        ));

        return back()->with('success', 'Disposisi berhasil dikirim ke '.$target->name.'.');
    }

    public function update(Request $request, Disposisi $disposisi): RedirectResponse
    {
        $user = $request->user();

        abort_unless(
            $disposisi->kepada_user_id === $user->id || $user->isAdmin(),
            403,
            'Anda hanya dapat memperbarui disposisi yang ditujukan kepada Anda.',
        );

        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'diproses', 'selesai'])],
        ]);

        $old = $disposisi->status;
        $disposisi->update($data);

        if ($old !== $data['status'] && $disposisi->dari_user_id !== $user->id) {
            $disposisi->dariUser->notify(new AppNotification(
                'Status Disposisi Diperbarui',
                'Disposisi "'.$disposisi->suratMasuk->perihal.'" kini berstatus '.$disposisi->statusLabel().'.',
                route('disposisi.index', ['tab' => 'diberikan']),
            ));
        }

        return back()->with('success', 'Status disposisi diperbarui menjadi "'.$disposisi->statusLabel().'".');
    }

    public function destroy(Request $request, Disposisi $disposisi): RedirectResponse
    {
        $user = $request->user();

        abort_unless(
            $disposisi->dari_user_id === $user->id || $user->isAdmin(),
            403,
            'Anda hanya dapat menghapus disposisi yang Anda buat.',
        );

        $disposisi->delete();

        return back()->with('success', 'Disposisi berhasil dihapus.');
    }

    private function map(Disposisi $d): array
    {
        return [
            'id' => $d->id,
            'surat_masuk_id' => $d->surat_masuk_id,
            'nomor_agenda' => $d->suratMasuk->nomor_agenda,
            'perihal' => $d->suratMasuk->perihal,
            'klasifikasi' => $d->suratMasuk->klasifikasi?->nama,
            'dari' => $d->dariUser->name,
            'kepada' => $d->kepadaUser->name,
            'catatan' => $d->catatan,
            'sifat' => $d->sifat,
            'batas_waktu' => $d->batas_waktu?->format('d M Y'),
            'terlambat' => $d->batas_waktu && $d->batas_waktu->isPast() && $d->status !== 'selesai',
            'status' => $d->status,
            'status_label' => $d->statusLabel(),
            'created_at' => $d->created_at->format('d M Y H:i'),
        ];
    }
}
