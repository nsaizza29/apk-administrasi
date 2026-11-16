<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pengaturan extends Model
{
    protected $table = 'pengaturan';

    protected $fillable = [
        'unit_id',
        'nama_instansi',
        'alamat',
        'telepon',
        'email',
        'website',
        'logo',
        'kota',
        'nama_pimpinan',
        'jabatan_pimpinan',
        'nip_pimpinan',
    ];

    public static function current(?int $unitId = null): self
    {
        $unitId ??= auth()->user()?->unit_id ?? OrganizationalUnit::foundationId();
        $unit = OrganizationalUnit::findOrFail($unitId);
        $pimpinan = User::query()
            ->where('unit_id', $unitId)
            ->where('role', User::ROLE_PIMPINAN)
            ->first();

        return static::firstOrCreate(['unit_id' => $unitId], [
            'nama_instansi' => mb_strtoupper($unit->name),
            'alamat' => 'Jl. Contoh No. 1',
            'telepon' => '(021) 000000',
            'email' => 'admin@instansi.go.id',
            'website' => 'www.instansi.go.id',
            'kota' => 'Jakarta',
            'nama_pimpinan' => $pimpinan?->name ?? 'Nama Penandatangan',
            'jabatan_pimpinan' => $pimpinan?->jabatan ?? 'Kepala Kantor',
        ]);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(OrganizationalUnit::class, 'unit_id');
    }
}
