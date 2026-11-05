<?php

namespace Tests\Feature;

use App\Models\CashSession;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CashSessionApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Company $otherCompany;
    private User $cashier;
    private User $admin;
    private User $inventory;
    private User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name'                => 'Zentry Store',
            'tax_id'              => '900.001.001-1',
            'currency'            => 'COP',
            'invoice_prefix'      => 'FV-',
            'next_invoice_number' => 100,
            'status'              => 'active',
        ]);

        $this->otherCompany = Company::create([
            'name'                => 'Other Store',
            'tax_id'              => '900.002.002-2',
            'currency'            => 'COP',
            'invoice_prefix'      => 'FV-',
            'next_invoice_number' => 100,
            'status'              => 'active',
        ]);

        $this->cashier = User::create([
            'company_id' => $this->company->id,
            'name'       => 'María Cajera',
            'email'      => 'maria@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'cashier',
            'status'     => 'active',
        ]);

        $this->admin = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Carlos Admin',
            'email'      => 'carlos@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $this->inventory = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Juan Inventario',
            'email'      => 'juan@test.com',
            'password'   => Hash::make('password123'),
            'role'       => 'inventory',
            'status'     => 'active',
        ]);

        $this->otherUser = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Otro Cajero',
            'email'      => 'otro@other.com',
            'password'   => Hash::make('password123'),
            'role'       => 'cashier',
            'status'     => 'active',
        ]);
    }

    public function test_cashier_can_open_cash_session(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/cash-sessions/open', [
                'opening_amount' => 150000,
                'notes'          => 'Turno de la mañana',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.session.opening_amount', '150000.00')
            ->assertJsonPath('data.session.status', 'open');

        $this->assertDatabaseHas('cash_sessions', [
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'opening_amount' => 150000,
            'status'         => 'open',
        ]);

        // Verificar que se crea el movimiento inicial de apertura
        $this->assertDatabaseHas('cash_movements', [
            'company_id'  => $this->company->id,
            'type'        => 'income',
            'amount'      => 150000,
            'reference'   => 'APERTURA',
        ]);
    }

    public function test_cannot_open_session_if_already_has_active_session(): void
    {
        CashSession::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'opening_amount' => 100000,
            'status'         => 'open',
            'opened_at'      => now(),
        ]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/cash-sessions/open', [
                'opening_amount' => 200000,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['session']);
    }

    public function test_cashier_can_get_current_cash_session(): void
    {
        CashSession::create([
            'company_id'      => $this->company->id,
            'user_id'         => $this->cashier->id,
            'opening_amount'  => 100000,
            'expected_amount' => 100000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/v1/cash-sessions/current');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.session.status', 'open')
            ->assertJsonPath('data.summary.initial', 100000);
    }

    public function test_cashier_can_record_manual_cash_movement(): void
    {
        $session = CashSession::create([
            'company_id'      => $this->company->id,
            'user_id'         => $this->cashier->id,
            'opening_amount'  => 100000,
            'expected_amount' => 100000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cash-sessions/{$session->id}/movements", [
                'type'        => 'withdrawal',
                'amount'      => 30000,
                'description' => 'Pago de domicilio urgente',
                'reference'   => 'DOM-01',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.movement.amount', '30000.00')
            ->assertJsonPath('data.summary.withdrawals', 30000)
            ->assertJsonPath('data.summary.expected', 70000);

        $this->assertDatabaseHas('cash_movements', [
            'cash_session_id' => $session->id,
            'type'            => 'withdrawal',
            'amount'          => 30000,
        ]);
    }

    public function test_cannot_record_negative_or_zero_amount(): void
    {
        $session = CashSession::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'opening_amount' => 100000,
            'status'         => 'open',
            'opened_at'      => now(),
        ]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cash-sessions/{$session->id}/movements", [
                'type'        => 'income',
                'amount'      => 0,
                'description' => 'Ingreso inválido',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_cannot_record_movement_on_closed_cash_session(): void
    {
        $session = CashSession::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'opening_amount' => 100000,
            'status'         => 'closed',
            'opened_at'      => now()->subHours(8),
            'closed_at'      => now(),
        ]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cash-sessions/{$session->id}/movements", [
                'type'        => 'income',
                'amount'      => 50000,
                'description' => 'Prueba en caja cerrada',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['session']);
    }

    public function test_cashier_can_close_cash_session_and_calculates_difference(): void
    {
        $session = CashSession::create([
            'company_id'      => $this->company->id,
            'user_id'         => $this->cashier->id,
            'opening_amount'  => 100000,
            'expected_amount' => 100000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        // Cierre con 95,000 (faltante de 5,000)
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cash-sessions/{$session->id}/close", [
                'closing_amount' => 95000,
                'notes'          => 'Faltaron 5000 en monedas',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.session.status', 'closed')
            ->assertJsonPath('data.session.closing_amount', '95000.00')
            ->assertJsonPath('data.session.expected_amount', '100000.00')
            ->assertJsonPath('data.session.difference', '-5000.00');

        $this->assertDatabaseHas('cash_sessions', [
            'id'             => $session->id,
            'status'         => 'closed',
            'difference'     => -5000,
            'closing_amount' => 95000,
        ]);
    }

    public function test_inventory_role_cannot_open_cash_session(): void
    {
        $response = $this->actingAs($this->inventory, 'sanctum')
            ->postJson('/api/v1/cash-sessions/open', [
                'opening_amount' => 100000,
            ]);

        $response->assertStatus(403);
    }

    public function test_cash_sessions_are_isolated_between_companies(): void
    {
        $sessionCompany1 = CashSession::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'opening_amount' => 100000,
            'status'         => 'open',
            'opened_at'      => now(),
        ]);

        $sessionCompany2 = CashSession::create([
            'company_id'     => $this->otherCompany->id,
            'user_id'        => $this->otherUser->id,
            'opening_amount' => 500000,
            'status'         => 'open',
            'opened_at'      => now(),
        ]);

        // Cajero de empresa 1 lista sesiones y no ve la de empresa 2
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/v1/cash-sessions');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($sessionCompany1->id, $ids);
        $this->assertNotContains($sessionCompany2->id, $ids);
    }
}
