<?php

namespace App\Models\Concerns;

use App\Models\OrganizationalUnit;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToOrganizationalUnit
{
    protected static function bootBelongsToOrganizationalUnit(): void
    {
        static::addGlobalScope('organizational_unit', function (Builder $builder): void {
            if (auth()->check()) {
                $builder->where(
                    $builder->getModel()->qualifyColumn('unit_id'),
                    auth()->user()->unit_id,
                );
            }
        });

        static::creating(function (Model $model): void {
            if ($model->getAttribute('unit_id') === null) {
                $model->setAttribute(
                    'unit_id',
                    auth()->user()?->unit_id ?? OrganizationalUnit::foundationId(),
                );
            }
        });
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(OrganizationalUnit::class, 'unit_id');
    }

}
