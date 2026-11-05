<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Company $otherCompany;
    private User $admin;
    private User $cashier;
    private User $inventory;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name'     => 'Test Corp',
            'tax_id'   => '900.111.001-1',
            'currency' => 'COP',
            'status'   => 'active',
        ]);

        $this->otherCompany = Company::create([
            'name'     => 'Rival Corp',
            'tax_id'   => '900.111.002-2',
            'currency' => 'COP',
            'status'   => 'active',
        ]);

        $this->admin = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Admin',
            'email'      => 'admin@corp.com',
            'password'   => Hash::make('pass'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $this->cashier = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Cajero',
            'email'      => 'cajero@corp.com',
            'password'   => Hash::make('pass'),
            'role'       => 'cashier',
            'status'     => 'active',
        ]);

        $this->inventory = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Inventario',
            'email'      => 'inventory@corp.com',
            'password'   => Hash::make('pass'),
            'role'       => 'inventory',
            'status'     => 'active',
        ]);

        $this->actingAs($this->admin);

        $this->customer = Customer::create([
            'company_id'      => $this->company->id,
            'document_type'   => 'CC',
            'document_number' => '10203040',
            'name'            => 'Laura Gómez',
            'business_name'   => 'Gómez Tech',
            'email'           => 'laura@gomez.com',
            'phone'           => '3001234567',
            'address'         => 'Calle 50 #10-20',
            'city'            => 'Bogotá',
            'credit_limit'    => 2000000,
            'is_active'       => true,
        ]);
    }

    // ─── Listado ───────────────────────────────────────────────────────────────

    public function test_admin_can_list_customers_paginated(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/customers');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'document_type', 'document_number', 'name', 'email', 'phone', 'is_active', 'credit_limit'],
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_cashier_can_list_customers(): void
    {
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/v1/customers');

        $response->assertOk();
    }

    public function test_customers_can_be_searched_by_name_or_document(): void
    {
        $this->actingAs($this->admin);

        Customer::create([
            'company_id'      => $this->company->id,
            'document_type'   => 'NIT',
            'document_number' => '999888777-1',
            'name'            => 'Distribuciones Alfa',
            'is_active'       => true,
        ]);

        // Búsqueda por documento
        $resDoc = $this->getJson('/api/v1/customers?search=999888777');
        $resDoc->assertOk();
        $this->assertCount(1, $resDoc->json('data'));
        $this->assertSame('Distribuciones Alfa', $resDoc->json('data.0.name'));

        // Búsqueda por nombre
        $resName = $this->getJson('/api/v1/customers?search=Laura');
        $resName->assertOk();
        $this->assertCount(1, $resName->json('data'));
        $this->assertSame('Laura Gómez', $resName->json('data.0.name'));
    }

    public function test_customers_can_be_filtered_by_active_status(): void
    {
        $this->actingAs($this->admin);

        Customer::create([
            'company_id'      => $this->company->id,
            'document_type'   => 'CC',
            'document_number' => '55555555',
            'name'            => 'Inactivo SA',
            'is_active'       => false,
        ]);

        $resActive = $this->getJson('/api/v1/customers?active=true');
        $resActive->assertOk();
        $this->assertTrue(collect($resActive->json('data'))->every(fn ($c) => $c['is_active'] === true));

        $resInactive = $this->getJson('/api/v1/customers?active=false');
        $resInactive->assertOk();
        $this->assertTrue(collect($resInactive->json('data'))->every(fn ($c) => $c['is_active'] === false));
    }

    // ─── Creación ──────────────────────────────────────────────────────────────

    public function test_admin_can_create_customer(): void
    {
        $payload = [
            'document_type'   => 'CC',
            'document_number' => '77889900',
            'name'            => 'Pedro Navaja',
            'email'           => 'pedro@navaja.com',
            'phone'           => '3119876543',
            'address'         => 'Av Central 45',
            'city'            => 'Medellín',
            'credit_limit'    => 500000,
            'is_active'       => true,
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/customers', $payload);

        $response->assertCreated()
            ->assertJsonPath('data.document_number', '77889900')
            ->assertJsonPath('data.name', 'Pedro Navaja');

        $this->assertDatabaseHas('customers', [
            'company_id'      => $this->company->id,
            'document_number' => '77889900',
        ]);
    }

    public function test_cashier_can_create_customer(): void
    {
        $payload = [
            'document_type'   => 'CC',
            'document_number' => '11223344',
            'name'            => 'Cliente de Mostrador',
        ];

        $response = $this->actingAs($this->cashier)
            ->postJson('/api/v1/customers', $payload);

        $response->assertCreated();
    }

    public function test_inventory_role_cannot_create_customer(): void
    {
        $response = $this->actingAs($this->inventory)
            ->postJson('/api/v1/customers', [
                'document_type'   => 'CC',
                'document_number' => '99999999',
                'name'            => 'No Autorizado',
            ]);

        $response->assertForbidden();
    }

    public function test_customer_validation_rules(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/customers', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['document_number', 'name']);
    }

    public function test_document_number_must_be_unique_within_company(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/customers', [
                'document_type'   => 'CC',
                'document_number' => '10203040', // Ya existe en $this->company
                'name'            => 'Duplicado',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['document_number']);
    }

    public function test_same_document_number_allowed_in_different_companies(): void
    {
        $rivalUser = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Rival Admin',
            'email'      => 'rival@other.com',
            'password'   => Hash::make('pass'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $response = $this->actingAs($rivalUser)
            ->postJson('/api/v1/customers', [
                'document_type'   => 'CC',
                'document_number' => '10203040', // Mismo documento que en $this->company
                'name'            => 'Mismo Doc en Otra Empresa',
            ]);

        $response->assertCreated();
    }

    // ─── Show, Update & Delete ─────────────────────────────────────────────────

    public function test_admin_can_show_customer(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/customers/{$this->customer->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $this->customer->id)
            ->assertJsonPath('data.name', 'Laura Gómez');
    }

    public function test_cannot_show_customer_from_another_company(): void
    {
        $rivalUser = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Rival Admin',
            'email'      => 'rival2@other.com',
            'password'   => Hash::make('pass'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $response = $this->actingAs($rivalUser)
            ->getJson("/api/v1/customers/{$this->customer->id}");

        $response->assertNotFound();
    }

    public function test_admin_can_update_customer(): void
    {
        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/customers/{$this->customer->id}", [
                'document_type'   => 'CC',
                'document_number' => '10203040',
                'name'            => 'Laura Gómez Editada',
                'phone'           => '3009999999',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Laura Gómez Editada')
            ->assertJsonPath('data.phone', '3009999999');

        $this->assertSame('Laura Gómez Editada', $this->customer->fresh()->name);
    }

    public function test_cashier_can_update_customer(): void
    {
        $response = $this->actingAs($this->cashier)
            ->putJson("/api/v1/customers/{$this->customer->id}", [
                'document_type'   => 'CC',
                'document_number' => '10203040',
                'name'            => 'Laura Gómez por Cajero',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Laura Gómez por Cajero');
    }

    public function test_admin_can_soft_delete_customer(): void
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/customers/{$this->customer->id}");

        $response->assertOk();

        $this->assertSoftDeleted('customers', ['id' => $this->customer->id]);
    }

    public function test_cashier_cannot_delete_customer(): void
    {
        $response = $this->actingAs($this->cashier)
            ->deleteJson("/api/v1/customers/{$this->customer->id}");

        $response->assertForbidden();
    }

    // ─── Búsqueda rápida (POS) ────────────────────────────────────────────────

    public function test_search_endpoint_returns_quick_results(): void
    {
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/v1/customers/search?q=Laura');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Laura Gómez');
    }

    public function test_search_requires_query_param(): void
    {
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/v1/customers/search');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['q']);
    }

    // ─── Aislamiento Multi-tenant ─────────────────────────────────────────────

    public function test_customers_are_isolated_between_companies(): void
    {
        $rivalUser = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Rival Admin',
            'email'      => 'rival3@other.com',
            'password'   => Hash::make('pass'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $this->actingAs($rivalUser);

        Customer::create([
            'company_id'      => $this->otherCompany->id,
            'document_type'   => 'NIT',
            'document_number' => '800100200-3',
            'name'            => 'Cliente de Otra Empresa',
            'is_active'       => true,
        ]);

        // El usuario de la otra empresa solo ve sus clientes
        $resRival = $this->getJson('/api/v1/customers');
        $resRival->assertOk();
        $this->assertCount(1, $resRival->json('data'));
        $this->assertSame('Cliente de Otra Empresa', $resRival->json('data.0.name'));

        // El admin original solo ve sus clientes
        $resOriginal = $this->actingAs($this->admin)->getJson('/api/v1/customers');
        $resOriginal->assertOk();
        $this->assertCount(1, $resOriginal->json('data'));
        $this->assertSame('Laura Gómez', $resOriginal->json('data.0.name'));
    }
}
