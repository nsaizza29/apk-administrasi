<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganizationalUnit;
use App\Models\Concerns\CanBeArchived;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PengajuanSurat extends Model
{
    use BelongsToOrganizationalUnit, CanBeArchived;

    protected $table = 'pengajuan_surat';

    public const STATUS_DIAJUKAN = 'diajukan';

    public const STATUS_DIPROSES = 'diproses';

    public const STATUS_MENUNGGU_PEMERIKSAAN = 'menunggu_pemeriksaan';

    public const STATUS_REVISI = 'revisi';

    public const STATUS_DISETUJUI = 'disetujui';

    public const STATUS_DITOLAK = 'ditolak';

    public const STATUS_SELESAI = 'selesai';

    protected $fillable = [
        'nomor_pengajuan',
        'pengaju_id',
        'klasifikasi_id',
        'tujuan',
        'perihal',
        'isi',
        'sifat',
        'lampiran',
        'status',
        'catatan_pengaju',
        'catatan_admin',
        'catatan_pemeriksa',
        'pemeriksa_id',
        'surat_keluar_id',
        'diajukan_at',
        'diperiksa_at',
        'unit_id',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'diajukan_at' => 'datetime',
            'diperiksa_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function pengaju(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pengaju_id');
    }

    public function klasifikasi(): BelongsTo
    {
        return $this->belongsTo(KlasifikasiSurat::class, 'klasifikasi_id');
    }

    public function pemeriksa(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pemeriksa_id');
    }

    public function suratKeluar(): BelongsTo
    {
        return $this->belongsTo(SuratKeluar::class, 'surat_keluar_id');
    }

    public function isEditable(): bool
    {
        return in_array($this->status, [self::STATUS_DIAJUKAN, self::STATUS_REVISI], true);
    }

    public function canBeDeleted(): bool
    {
        return $this->surat_keluar_id === null;
    }

    public function canBeReviewed(): bool
    {
        return $this->status === self::STATUS_MENUNGGU_PEMERIKSAAN;
    }

    public function canBeFinalized(): bool
    {
        return $this->status === self::STATUS_DISETUJUI;
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_DIAJUKAN => 'Diajukan',
            self::STATUS_DIPROSES => 'Diproses Admin',
            self::STATUS_MENUNGGU_PEMERIKSAAN => 'Menunggu Pemeriksaan',
            self::STATUS_REVISI => 'Perlu Revisi',
            self::STATUS_DISETUJUI => 'Disetujui',
            self::STATUS_DITOLAK => 'Ditolak',
            self::STATUS_SELESAI => 'Selesai',
            default => $this->status,
        };
    }
}
