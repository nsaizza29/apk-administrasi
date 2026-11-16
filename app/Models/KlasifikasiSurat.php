<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganizationalUnit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KlasifikasiSurat extends Model
{
    use BelongsToOrganizationalUnit;

    protected $table = 'klasifikasi_surat';

    protected $fillable = [
        'kode',
        'nama',
        'deskripsi',
        'unit_id',
    ];

    public function suratMasuk(): HasMany
    {
        return $this->hasMany(SuratMasuk::class, 'klasifikasi_id');
    }

    public function suratKeluar(): HasMany
    {
        return $this->hasMany(SuratKeluar::class, 'klasifikasi_id');
    }
}
