<?php

namespace App\Models\Concerns;

trait CanBeArchived
{
    public function isArsip(): bool
    {
        return $this->archived_at !== null;
    }
}
