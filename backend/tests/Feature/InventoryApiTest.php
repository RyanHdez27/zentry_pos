<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Company;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Company $otherCompany;
    private User $admin;
    private User $cashier;
    private User $inventoryUser;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name'     => 'Empresa Inventario SAS',
            'tax_id'   => '900.222.001-1',
            'currency' => 'COP',
            'status'   => 'active',
        ]);

        $this->otherCompany = Company::create([
            'name'     => 'Empresa Rival SAS',
            'tax_id'   => '900.222.002-2',
            'currency' => 'COP',
            'status'   => 'active',
        ]);

        $this->admin = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Admin Inv',
            'email'      => 'admin@inv.com',
            'password'   => Hash::make('password'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $this->cashier = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Cajero Inv',
            'email'      => 'cajero@inv.com',
            'password'   => Hash::make('password'),
            'role'       => 'cashier',
            'status'     => 'active',
        ]);

        $this->inventoryUser = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Operador Inv',
            'email'      => 'operador@inv.com',
            'password'   => Hash::make('password'),
            'role'       => 'inventory',
            'status'     => 'active',
        ]);

        $this->product = Product::create([
            'company_id'  => $this->company->id,
            'name'        => 'Mouse Ergonómico',
            'sku'         => 'MOU-ERG-01',
            'price'       => 150000,
            'cost'        => 90000,
            'stock'       => 10,
            'stock_min'   => 3,
            'track_stock' => true,
        ]);
    }

    // ── Resumen / KPIs ────────────────────────────────────────────────────────

    public function test_summary_returns_correct_kpis(): void
    {
        // Producto 1: en stock normal ($90.000 * 10 = $900.000)
        // Ya creado en setUp: stock=10, min=3

        // Producto 2: stock bajo (stock=2, min=5, cost=50.000 -> 100.000)
        Product::create([
            'company_id'  => $this->company->id,
            'name'        => 'Teclado Mecánico',
            'sku'         => 'TEC-MEC-01',
            'price'       => 120000,
            'cost'        => 50000,
            'stock'       => 2,
            'stock_min'   => 5,
            'track_stock' => true,
        ]);

        // Producto 3: agotado (stock=0, min=2)
        Product::create([
            'company_id'  => $this->company->id,
            'name'        => 'Cable HDMI',
            'sku'         => 'CAB-HDM-01',
            'price'       => 30000,
            'cost'        => 15000,
            'stock'       => 0,
            'stock_min'   => 2,
            'track_stock' => true,
        ]);

        // Producto ajeno de otra empresa (no debe contabilizarse)
        Product::create([
            'company_id'  => $this->otherCompany->id,
            'name'        => 'Producto Ajeno',
            'sku'         => 'AJE-01',
            'price'       => 999999,
            'cost'        => 500000,
            'stock'       => 100,
            'stock_min'   => 1,
            'track_stock' => true,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/inventory/summary');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_products', 3)
            ->assertJsonPath('data.low_stock_count', 1)
            ->assertJsonPath('data.out_of_stock_count', 1);

        $this->assertEquals(1000000, $response->json('data.total_inventory_value'));
    }

    // ── Kardex / Movimientos ──────────────────────────────────────────────────

    public function test_movements_returns_paginated_list(): void
    {
        InventoryMovement::create([
            'company_id'     => $this->company->id,
            'product_id'     => $this->product->id,
            'user_id'        => $this->admin->id,
            'type'           => 'entry',
            'quantity'       => 10,
            'previous_stock' => 0,
            'current_stock'  => 10,
            'reason'         => 'Compra inicial',
        ]);

        // Movimiento de otra empresa
        $foreignProduct = Product::create([
            'company_id'  => $this->otherCompany->id,
            'name'        => 'Prod Ajeno',
            'sku'         => 'SKU-EXT-99',
            'price'       => 1000,
            'cost'        => 500,
            'stock'       => 5,
            'track_stock' => true,
        ]);

        InventoryMovement::create([
            'company_id'     => $this->otherCompany->id,
            'product_id'     => $foreignProduct->id,
            'type'           => 'entry',
            'quantity'       => 5,
            'previous_stock' => 0,
            'current_stock'  => 5,
            'reason'         => 'Movimiento ajeno',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/inventory/movements');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reason', 'Compra inicial')
            ->assertJsonStructure([
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_movements_can_be_filtered_by_product_and_type(): void
    {
        InventoryMovement::create([
            'company_id'     => $this->company->id,
            'product_id'     => $this->product->id,
            'type'           => 'entry',
            'quantity'       => 5,
            'previous_stock' => 5,
            'current_stock'  => 10,
            'reason'         => 'Entrada 1',
        ]);

        InventoryMovement::create([
            'company_id'     => $this->company->id,
            'product_id'     => $this->product->id,
            'type'           => 'exit',
            'quantity'       => -2,
            'previous_stock' => 10,
            'current_stock'  => 8,
            'reason'         => 'Salida 1',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/inventory/movements?product_id={$this->product->id}&type=exit");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'exit');
    }

    // ── Ajustes de Inventario ─────────────────────────────────────────────────

    public function test_admin_can_adjust_stock_entry(): void
    {
        // Stock inicial era 10
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/inventory/adjust', [
                'product_id' => $this->product->id,
                'type'       => 'entry',
                'quantity'   => 5,
                'reason'     => 'Compra de reposición',
                'reference'  => 'FAC-PROV-102',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.new_stock', '15.000');

        $this->assertEquals(15, (float) $this->product->fresh()->stock);

        $this->assertDatabaseHas('inventory_movements', [
            'company_id'     => $this->company->id,
            'product_id'     => $this->product->id,
            'user_id'        => $this->admin->id,
            'type'           => 'entry',
            'quantity'       => 5.000,
            'previous_stock' => 10.000,
            'current_stock'  => 15.000,
            'reason'         => 'Compra de reposición',
            'reference'      => 'FAC-PROV-102',
        ]);
    }

    public function test_inventory_role_can_adjust_stock_exit(): void
    {
        // Stock inicial 10, sacamos 4 -> queda 6
        $response = $this->actingAs($this->inventoryUser, 'sanctum')
            ->postJson('/api/v1/inventory/adjust', [
                'product_id' => $this->product->id,
                'type'       => 'exit',
                'quantity'   => 4,
                'reason'     => 'Unidades dañadas en almacén',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.new_stock', '6.000');

        $this->assertEquals(6, (float) $this->product->fresh()->stock);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id'     => $this->product->id,
            'user_id'        => $this->inventoryUser->id,
            'type'           => 'exit',
            'quantity'       => -4.000,
            'previous_stock' => 10.000,
            'current_stock'  => 6.000,
        ]);
    }

    public function test_cashier_cannot_adjust_stock(): void
    {
        $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/inventory/adjust', [
                'product_id' => $this->product->id,
                'type'       => 'entry',
                'quantity'   => 1,
                'reason'     => 'Intento no autorizado',
            ])
            ->assertStatus(403);
    }

    public function test_stock_cannot_drop_below_zero_if_tracked(): void
    {
        // Stock inicial es 10. Intentamos sacar 15.
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/inventory/adjust', [
                'product_id' => $this->product->id,
                'type'       => 'exit',
                'quantity'   => 15,
                'reason'     => 'Salida excesiva',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);

        // Stock original intacto
        $this->assertEquals(10, (float) $this->product->fresh()->stock);
    }

    public function test_cannot_adjust_stock_of_another_company_product(): void
    {
        $foreignProduct = Product::create([
            'company_id'  => $this->otherCompany->id,
            'name'        => 'Producto Ajeno',
            'sku'         => 'RIV-01',
            'price'       => 1000,
            'cost'        => 500,
            'stock'       => 20,
            'track_stock' => true,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/inventory/adjust', [
                'product_id' => $foreignProduct->id,
                'type'       => 'entry',
                'quantity'   => 5,
                'reason'     => 'Intento en producto ajeno',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);
    }

    public function test_inventory_movements_are_isolated_between_companies(): void
    {
        // Admin crea movimiento en su producto
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/inventory/adjust', [
                'product_id' => $this->product->id,
                'type'       => 'entry',
                'quantity'   => 2,
                'reason'     => 'Ingreso Empresa 1',
            ])
            ->assertStatus(201);

        // Usuario de la otra empresa consulta sus movimientos
        $otherAdmin = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Otro Admin',
            'email'      => 'otro@rival.com',
            'password'   => Hash::make('pass'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $response = $this->actingAs($otherAdmin, 'sanctum')
            ->getJson('/api/v1/inventory/movements');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
