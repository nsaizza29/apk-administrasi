<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use RuntimeException;

class OrganizationalUnit extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'parent_id',
    ];

    public static function foundationId(): int
    {
        $id = static::query()->where('slug', 'yayasan')->value('id');

        if ($id === null) {
            throw new RuntimeException('Unit Yayasan belum tersedia.');
        }

        return (int) $id;
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
