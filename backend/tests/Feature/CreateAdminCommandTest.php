<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_admin_via_artisan_command(): void
    {
        $this->artisan('zentry:create-admin', [
            '--name'     => 'Super Admin Test',
            '--email'    => 'superadmin@test.com',
            '--password' => 'secret123',
            '--company'  => 'Mi Empresa Test',
        ])
        ->assertExitCode(0);

        $this->assertDatabaseHas('users', [
            'email'  => 'superadmin@test.com',
            'role'   => 'admin',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('companies', [
            'name' => 'Mi Empresa Test',
        ]);
    }
}
