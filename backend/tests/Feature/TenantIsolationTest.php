<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Company $companyA;
    private Company $companyB;
    private User $userA;
    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->companyA = Company::create([
            'name' => 'Empresa Alfa',
            'tax_id' => '111.111.111-1',
            'currency' => 'COP',
            'status' => 'active',
        ]);

        $this->companyB = Company::create([
            'name' => 'Empresa Beta',
            'tax_id' => '222.222.222-2',
            'currency' => 'USD',
            'status' => 'active',
        ]);

        $this->userA = User::create([
            'company_id' => $this->companyA->id,
            'name' => 'Usuario Alfa',
            'email' => 'alfa@empresa.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->userB = User::create([
            'company_id' => $this->companyB->id,
            'name' => 'Usuario Beta',
            'email' => 'beta@empresa.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'status' => 'active',
        ]);
    }

    public function test_tenant_context_is_properly_bound_to_user_a(): void
    {
        $tokenA = $this->userA->createToken('token-a')->plainTextToken;

        $responseA = $this->withHeader('Authorization', 'Bearer '.$tokenA)
            ->getJson('/api/v1/auth/me');

        $responseA->assertStatus(200)
            ->assertJsonPath('data.company.id', $this->companyA->id)
            ->assertJsonPath('data.company.name', 'Empresa Alfa');
    }

    public function test_tenant_context_is_properly_bound_to_user_b(): void
    {
        $tokenB = $this->userB->createToken('token-b')->plainTextToken;

        $responseB = $this->withHeader('Authorization', 'Bearer '.$tokenB)
            ->getJson('/api/v1/auth/me');

        $responseB->assertStatus(200)
            ->assertJsonPath('data.company.id', $this->companyB->id)
            ->assertJsonPath('data.company.name', 'Empresa Beta');
    }
}
