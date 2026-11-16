<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganizationalUnit;
use App\Models\Concerns\CanBeArchived;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SuratMasuk extends Model
{
    use BelongsToOrganizationalUnit, CanBeArchived;

    protected $table = 'surat_masuk';

    protected $fillable = [
        'nomor_agenda',
        'tanggal_surat',
        'tanggal_diterima',
        'asal',
        'perihal',
        'isi',
        'klasifikasi_id',
        'sifat',
        'status',
        'lampiran',
        'user_id',
        'unit_id',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_surat' => 'date',
            'tanggal_diterima' => 'date',
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

    public function disposisi(): HasMany
    {
        return $this->hasMany(Disposisi::class);
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            'diterima' => 'Diterima',
            'diproses' => 'Diproses',
            'selesai' => 'Selesai',
            'diarsipkan' => 'Diarsipkan',
            default => $this->status,
        };
    }
}
