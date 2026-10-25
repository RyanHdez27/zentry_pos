<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name' => 'Tech Corp SAS',
            'legal_name' => 'Tech Corporation S.A.S.',
            'tax_id' => '900.123.456-1',
            'currency' => 'COP',
            'default_tax_rate' => 19.00,
            'invoice_prefix' => 'FAC-',
            'status' => 'active',
        ]);

        $this->user = User::create([
            'company_id' => $this->company->id,
            'name' => 'Carlos Administrador',
            'email' => 'admin@techcorp.com',
            'password' => Hash::make('secretPassword123'),
            'role' => 'admin',
            'status' => 'active',
        ]);
    }

    public function test_health_check_returns_ok_and_connected_database(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('database', 'connected');
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@techcorp.com',
            'password' => 'secretPassword123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'token_type',
                    'user' => ['id', 'name', 'email', 'role', 'status'],
                    'company' => ['id', 'name', 'tax_id', 'currency'],
                ],
            ]);

        $this->assertEquals('Bearer', $response->json('data.token_type'));
        $this->assertEquals('Tech Corp SAS', $response->json('data.company.name'));
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@techcorp.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->user->update(['status' => 'inactive']);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@techcorp.com',
            'password' => 'secretPassword123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_unauthenticated_user_cannot_access_me_endpoint(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $token = $this->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'admin@techcorp.com')
            ->assertJsonPath('data.company.id', $this->company->id);
    }

    public function test_user_can_logout_and_revoke_token(): void
    {
        $token = $this->user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
