<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganizationalUnit;
use App\Models\Concerns\CanBeArchived;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SuratKeluar extends Model
{
    use BelongsToOrganizationalUnit, CanBeArchived;

    protected $table = 'surat_keluar';

    protected $fillable = [
        'nomor_surat',
        'tanggal_surat',
        'tempat_surat',
        'tujuan',
        'perihal',
        'jumlah_lampiran',
        'isi',
        'template',
        'template_data',
        'klasifikasi_id',
        'sifat',
        'status',
        'penandatangan_nama',
        'penandatangan_jabatan',
        'tembusan',
        'lampiran',
        'user_id',
        'unit_id',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_surat' => 'date',
            'template_data' => 'array',
            'archived_at' => 'datetime',
        ];
    }

    public function klasifikasi(): BelongsTo
    {
        return $this->belongsTo(KlasifikasiSurat::class, 'klasifikasi_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pengajuan(): HasOne
    {
        return $this->hasOne(PengajuanSurat::class, 'surat_keluar_id');
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            'draft' => 'Draft',
            'dikirim' => 'Dikirim',
            'diterima' => 'Diterima',
            'diarsipkan' => 'Diarsipkan',
            default => $this->status,
        };
    }

    public function templateLabel(): string
    {
        $nama = TemplateSurat::where('slug', $this->template)->value('nama');

        if ($nama) {
            return $nama;
        }

        return match ($this->template) {
            'undangan' => 'Surat Undangan',
            'pemberitahuan' => 'Surat Pemberitahuan',
            'permohonan' => 'Surat Permohonan',
            'tugas' => 'Surat Tugas',
            'keterangan' => 'Surat Keterangan',
            default => 'Surat Umum',
        };
    }
}
