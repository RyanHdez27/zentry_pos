<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Company;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Company $otherCompany;
    private User $admin;
    private User $cashier;
    private User $inventory;
    private Category $category;

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
            'email'      => 'inv@corp.com',
            'password'   => Hash::make('pass'),
            'role'       => 'inventory',
            'status'     => 'active',
        ]);

        $this->category = Category::create([
            'company_id' => $this->company->id,
            'name'       => 'Electrónica',
            'slug'       => 'electronica',
        ]);
    }

    private function makeProduct(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'company_id' => $this->company->id,
            'name'       => 'Producto Test',
            'sku'        => 'SKU-001',
            'price'      => 100000,
            'stock'      => 10,
        ], $overrides));
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_admin_can_list_products_paginated(): void
    {
        $this->makeProduct(['sku' => 'P1', 'name' => 'Prod A']);
        $this->makeProduct(['sku' => 'P2', 'name' => 'Prod B']);

        // Producto de otra empresa — no debe aparecer
        Product::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Ajeno',
            'sku'        => 'AJ-001',
            'price'      => 50000,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/products');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure(['meta' => ['current_page', 'last_page', 'per_page', 'total']]);
    }

    public function test_products_can_be_filtered_by_category(): void
    {
        $this->makeProduct(['sku' => 'P1', 'category_id' => $this->category->id]);
        $this->makeProduct(['sku' => 'P2']); // sin categoría

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/products?category_id={$this->category->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_products_can_be_searched_by_name_or_sku(): void
    {
        $this->makeProduct(['sku' => 'LAP-001', 'name' => 'Laptop Pro']);
        $this->makeProduct(['sku' => 'MOU-001', 'name' => 'Mouse Inalámbrico']);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/products?search=Laptop');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Laptop Pro');
    }

    public function test_low_stock_filter_works(): void
    {
        $this->makeProduct(['sku' => 'P1', 'stock' => 2,  'stock_min' => 5,  'track_stock' => true]);
        $this->makeProduct(['sku' => 'P2', 'stock' => 20, 'stock_min' => 5,  'track_stock' => true]);
        $this->makeProduct(['sku' => 'P3', 'stock' => 0,  'stock_min' => 1,  'track_stock' => false]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/products?low_stock=1');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data'); // solo P1
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function test_admin_can_create_product(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/products', [
                'name'        => 'Laptop Lenovo',
                'sku'         => 'LAP-LEN-001',
                'price'       => 2499000,
                'cost'        => 1900000,
                'tax_rate'    => 19,
                'stock'       => 10,
                'stock_min'   => 2,
                'category_id' => $this->category->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Laptop Lenovo')
            ->assertJsonPath('data.company_id', $this->company->id);

        $this->assertDatabaseHas('products', [
            'company_id' => $this->company->id,
            'sku'        => 'LAP-LEN-001',
        ]);
    }

    public function test_inventory_role_can_create_product(): void
    {
        $this->actingAs($this->inventory, 'sanctum')
            ->postJson('/api/v1/products', [
                'name'  => 'Producto Inv',
                'sku'   => 'INV-001',
                'price' => 50000,
            ])
            ->assertStatus(201);
    }

    public function test_cashier_cannot_create_product(): void
    {
        $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/products', [
                'name'  => 'Intento',
                'price' => 1000,
            ])
            ->assertStatus(403);
    }

    public function test_product_requires_name_and_price(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/products', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'price']);
    }

    public function test_sku_must_be_unique_per_company(): void
    {
        $this->makeProduct(['sku' => 'DUPLICADO']);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/products', [
                'name'  => 'Otro',
                'sku'   => 'DUPLICADO',
                'price' => 1000,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['sku']);
    }

    public function test_category_must_belong_to_same_company(): void
    {
        $foreignCategory = Category::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Ajena',
            'slug'       => 'ajena',
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/products', [
                'name'        => 'Producto',
                'price'       => 1000,
                'category_id' => $foreignCategory->id,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function test_admin_can_show_product(): void
    {
        $product = $this->makeProduct();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/products/{$product->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $product->id);
    }

    public function test_cannot_show_product_from_another_company(): void
    {
        $foreign = Product::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Ajeno',
            'sku'        => 'AJ-001',
            'price'      => 1000,
        ]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/products/{$foreign->id}")
            ->assertStatus(404);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_admin_can_update_product(): void
    {
        $product = $this->makeProduct();

        $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/v1/products/{$product->id}", ['price' => 999000])
            ->assertStatus(200)
            ->assertJsonPath('data.price', '999000.00');
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function test_admin_can_soft_delete_product(): void
    {
        $product = $this->makeProduct();

        $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/products/{$product->id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    // ── Search ────────────────────────────────────────────────────────────────

    public function test_search_endpoint_returns_quick_results(): void
    {
        $this->makeProduct(['sku' => 'S1', 'name' => 'Sony WH-1000XM5', 'is_active' => true]);
        $this->makeProduct(['sku' => 'S2', 'name' => 'Samsung Galaxy', 'is_active' => true]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/v1/products/search?q=Sony');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Sony WH-1000XM5');
    }

    public function test_search_requires_query_param(): void
    {
        $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/v1/products/search')
            ->assertStatus(422);
    }

    // ── Multi-tenant aislamiento ──────────────────────────────────────────────

    public function test_products_are_fully_isolated_between_companies(): void
    {
        // Admin de empresa A crea un producto
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/products', ['name' => 'Prod A', 'sku' => 'A-001', 'price' => 1000])
            ->assertStatus(201);

        // Admin de empresa B no debería verlo
        $adminB = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Admin B',
            'email'      => 'adminb@rival.com',
            'password'   => Hash::make('pass'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $this->actingAs($adminB, 'sanctum')
            ->getJson('/api/v1/products')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }
}
