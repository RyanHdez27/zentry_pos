<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CompanyApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $admin;
    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name'             => 'Zentry Store',
            'legal_name'       => 'Zentry S.A.S.',
            'tax_id'           => '900.001.001-1',
            'currency'         => 'COP',
            'default_tax_rate' => 19.00,
            'invoice_prefix'   => 'FV-',
            'status'           => 'active',
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
    }

    public function test_user_can_get_company_info(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/v1/company');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Zentry Store')
            ->assertJsonPath('data.currency', 'COP');
    }

    public function test_admin_can_update_company_info(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/v1/company', [
                'name'             => 'Zentry Global Store',
                'currency'         => 'USD',
                'default_tax_rate' => 16.00,
                'invoice_prefix'   => 'INV-',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Zentry Global Store')
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.invoice_prefix', 'INV-');

        $this->assertEquals('Zentry Global Store', $this->company->fresh()->name);
    }

    public function test_cashier_cannot_update_company_info(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->putJson('/api/v1/company', [
                'name'             => 'Hack Store',
                'currency'         => 'USD',
                'default_tax_rate' => 16.00,
                'invoice_prefix'   => 'INV-',
            ]);

        $response->assertStatus(403);
    }
}
