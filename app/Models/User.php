<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_PIMPINAN = 'pimpinan';

    public const ROLE_STAF = 'staf';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'jabatan',
        'unit_id',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'unit_id' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $user): void {
            if ($user->unit_id === null) {
                $user->unit_id = auth()->user()?->unit_id ?? OrganizationalUnit::foundationId();
            }
        });
    }

    public function organizationalUnit(): BelongsTo
    {
        return $this->belongsTo(OrganizationalUnit::class, 'unit_id');
    }

    public function suratMasuk(): HasMany
    {
        return $this->hasMany(SuratMasuk::class);
    }

    public function suratKeluar(): HasMany
    {
        return $this->hasMany(SuratKeluar::class);
    }

    public function disposisiDiberikan(): HasMany
    {
        return $this->hasMany(Disposisi::class, 'dari_user_id');
    }

    public function disposisiDiterima(): HasMany
    {
        return $this->hasMany(Disposisi::class, 'kepada_user_id');
    }

    public function pengajuan(): HasMany
    {
        return $this->hasMany(PengajuanSurat::class, 'pengaju_id');
    }

    public function pengajuanDiperiksa(): HasMany
    {
        return $this->hasMany(PengajuanSurat::class, 'pemeriksa_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isPimpinan(): bool
    {
        return $this->role === self::ROLE_PIMPINAN;
    }

    public function isStaf(): bool
    {
        return $this->role === self::ROLE_STAF;
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function roleLabel(): string
    {
        return match ($this->role) {
            self::ROLE_ADMIN => 'Administrator',
            self::ROLE_PIMPINAN => 'Pimpinan',
            default => 'Staf',
        };
    }
}
