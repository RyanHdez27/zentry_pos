<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'zentry:create-admin 
                            {--name= : Nombre completo del administrador}
                            {--email= : Correo electrónico de acceso}
                            {--password= : Contraseña de acceso}
                           ';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crea o actualiza un usuario con privilegios de Administrador (Superadmin) en el sistema';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('────────────────────────────────────────────');
        $this->info('  🧾 Zentry POS — Creador de Superadministrador');
        $this->info('────────────────────────────────────────────');

        $email = $this->option('email') ?: $this->ask('Correo electrónico', 'admin@zentrypos.com');
        $existing = User::where('email', $email)->first();
        $name = $this->option('name') ?: ($existing?->name ?? $this->ask('Nombre del Administrador', 'Administrador Principal'));
        $password = $this->option('password');
        if (! $password && ! $existing) {
            $password = $this->secret('Contraseña (mínimo 10 caracteres)');
        }

        if ($password && strlen($password) < 10) {
            $this->error('❌ La contraseña debe tener al menos 10 caracteres.');
            return self::FAILURE;
        }

        $nameParts = explode(' ', trim($name));
        $initials = strtoupper(substr($nameParts[0], 0, 1) . (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : ''));

        // Crear o actualizar usuario
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'company_id' => null,
                'name'       => $name,
                'password'   => $password ? Hash::make($password) : ($existing?->password ?? Hash::make('')),
                'role'       => 'superadmin',
                'status'     => 'active',
                'avatar'     => $initials,
            ]
        );

        $this->newLine();
        $this->info("✅ ¡Usuario Administrador configurado exitosamente!");
        $this->table(
            ['Parámetro', 'Valor'],
            [
                ['Nombre', $user->name],
                ['Email', $user->email],
                ['Rol', 'superadmin (gestión de empresas)'],
                ['Empresa', 'Sin empresa asignada'],
            ]
        );

        return self::SUCCESS;
    }
}
