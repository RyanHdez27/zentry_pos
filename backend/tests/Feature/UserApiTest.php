<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Company $otherCompany;
    private User $admin;
    private User $cashier;
    private User $otherAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name'     => 'Zentry Store',
            'tax_id'   => '900.001.001-1',
            'currency' => 'COP',
            'status'   => 'active',
        ]);

        $this->otherCompany = Company::create([
            'name'     => 'Rival Store',
            'tax_id'   => '900.002.002-2',
            'currency' => 'COP',
            'status'   => 'active',
        ]);

        $this->admin = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Carlos Admin',
            'email'      => 'carlos@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $this->cashier = User::create([
            'company_id' => $this->company->id,
            'name'       => 'María Cajera',
            'email'      => 'maria@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'cashier',
            'status'     => 'active',
        ]);

        $this->otherAdmin = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Otro Admin',
            'email'      => 'otro@other.com',
            'password'   => Hash::make('password123'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);
    }

    public function test_admin_can_list_company_users(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/users');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($this->admin->id, $ids);
        $this->assertContains($this->cashier->id, $ids);
        $this->assertNotContains($this->otherAdmin->id, $ids);
    }

    public function test_admin_can_create_user(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/users', [
                'name'     => 'Nuevo Cajero',
                'email'    => 'nuevo@test.com',
                'password' => 'secret123',
                'role'     => 'cashier',
                'phone'    => '+57 300 111 2233',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Nuevo Cajero')
            ->assertJsonPath('data.role', 'cashier');

        $this->assertDatabaseHas('users', [
            'company_id' => $this->company->id,
            'email'      => 'nuevo@test.com',
        ]);
    }

    public function test_admin_can_update_user_role(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/users/{$this->cashier->id}", [
                'role' => 'inventory',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.role', 'inventory');

        $this->assertEquals('inventory', $this->cashier->fresh()->role);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/users/{$this->admin->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user']);
    }

    public function test_cashier_cannot_manage_users(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/v1/users');

        $response->assertStatus(403);
    }
}
