<?php

namespace App\Console\Commands;

use App\Models\OrganizationalUnit;
use App\Models\User;
use Illuminate\Console\Command;

class CreateUnitAdmin extends Command
{
    protected $signature = 'app:create-unit-admin {unit : Unit slug, such as paud, tk, sd, smp, or sma}';

    protected $description = 'Create the first administrator account for an organizational unit';

    public function handle(): int
    {
        $unit = OrganizationalUnit::query()
            ->where('slug', $this->argument('unit'))
            ->first();

        if (! $unit) {
            $this->error('Unit tidak ditemukan.');

            return self::FAILURE;
        }

        if (User::query()->where('unit_id', $unit->id)->where('role', User::ROLE_ADMIN)->exists()) {
            $this->error('Unit ini sudah memiliki Admin.');

            return self::FAILURE;
        }

        $name = $this->ask('Nama Admin');
        $email = $this->ask('Email Admin');
        $password = $this->secret('Password (minimal 8 karakter)');

        if (! $name || ! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen((string) $password) < 8) {
            $this->error('Nama, email yang valid, dan password minimal 8 karakter wajib diisi.');

            return self::FAILURE;
        }

        if (User::query()->where('email', $email)->exists()) {
            $this->error('Email sudah digunakan.');

            return self::FAILURE;
        }

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => User::ROLE_ADMIN,
            'unit_id' => $unit->id,
        ]);

        $this->info("Admin unit {$unit->name} berhasil dibuat.");

        return self::SUCCESS;
    }
}
