<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Company $otherCompany;
    private User $admin;
    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name'     => 'Empresa Test',
            'tax_id'   => '900.000.001-1',
            'currency' => 'COP',
            'status'   => 'active',
        ]);

        $this->otherCompany = Company::create([
            'name'     => 'Otra Empresa',
            'tax_id'   => '900.000.002-2',
            'currency' => 'COP',
            'status'   => 'active',
        ]);

        $this->admin = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Admin Test',
            'email'      => 'admin@test.com',
            'password'   => Hash::make('password'),
            'role'       => 'admin',
            'status'     => 'active',
        ]);

        $this->cashier = User::create([
            'company_id' => $this->company->id,
            'name'       => 'Cajero Test',
            'email'      => 'cajero@test.com',
            'password'   => Hash::make('password'),
            'role'       => 'cashier',
            'status'     => 'active',
        ]);
    }

    private function actingAsAdmin(): static
    {
        return $this->actingAs($this->admin, 'sanctum');
    }

    private function actingAsCashier(): static
    {
        return $this->actingAs($this->cashier, 'sanctum');
    }

    // ── Index ─────────────────────────────────────────────────────────────────

    public function test_admin_can_list_categories(): void
    {
        Category::create(['company_id' => $this->company->id, 'name' => 'Cat A', 'slug' => 'cat-a']);
        Category::create(['company_id' => $this->company->id, 'name' => 'Cat B', 'slug' => 'cat-b']);

        // Categoría de otra empresa — no debe aparecer
        Category::create(['company_id' => $this->otherCompany->id, 'name' => 'Ajena', 'slug' => 'ajena']);

        $response = $this->actingAsAdmin()->getJson('/api/v1/categories');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_cashier_can_list_categories(): void
    {
        $response = $this->actingAsCashier()->getJson('/api/v1/categories');
        $response->assertStatus(200);
    }

    public function test_unauthenticated_cannot_list_categories(): void
    {
        $this->getJson('/api/v1/categories')->assertStatus(401);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function test_admin_can_create_category(): void
    {
        $response = $this->actingAsAdmin()->postJson('/api/v1/categories', [
            'name'  => 'Electrónica',
            'color' => '#3b82f6',
            'icon'  => 'Cpu',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Electrónica')
            ->assertJsonPath('data.company_id', $this->company->id);

        $this->assertDatabaseHas('categories', [
            'company_id' => $this->company->id,
            'name'       => 'Electrónica',
            'slug'       => 'electronica',
        ]);
    }

    public function test_cashier_cannot_create_category(): void
    {
        $this->actingAsCashier()
            ->postJson('/api/v1/categories', ['name' => 'Nueva'])
            ->assertStatus(403);
    }

    public function test_category_name_is_required(): void
    {
        $this->actingAsAdmin()
            ->postJson('/api/v1/categories', ['color' => '#fff'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_slug_must_be_unique_within_company(): void
    {
        Category::create([
            'company_id' => $this->company->id,
            'name'       => 'Original',
            'slug'       => 'mi-slug',
        ]);

        $this->actingAsAdmin()
            ->postJson('/api/v1/categories', ['name' => 'Duplicado', 'slug' => 'mi-slug'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['slug']);
    }

    public function test_same_slug_can_exist_in_different_companies(): void
    {
        Category::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Cat Otra',
            'slug'       => 'electronica',
        ]);

        $this->actingAsAdmin()
            ->postJson('/api/v1/categories', ['name' => 'Electrónica', 'slug' => 'electronica'])
            ->assertStatus(201);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_admin_can_update_own_category(): void
    {
        $category = Category::create([
            'company_id' => $this->company->id,
            'name'       => 'Viejo Nombre',
            'slug'       => 'viejo',
        ]);

        $this->actingAsAdmin()
            ->putJson("/api/v1/categories/{$category->id}", ['name' => 'Nuevo Nombre'])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Nuevo Nombre');
    }

    public function test_admin_cannot_update_another_company_category(): void
    {
        $otherCategory = Category::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Ajena',
            'slug'       => 'ajena',
        ]);

        $this->actingAsAdmin()
            ->putJson("/api/v1/categories/{$otherCategory->id}", ['name' => 'Hack'])
            ->assertStatus(404); // CompanyScope filtra y lanza 404
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function test_admin_can_delete_category(): void
    {
        $category = Category::create([
            'company_id' => $this->company->id,
            'name'       => 'Para borrar',
            'slug'       => 'para-borrar',
        ]);

        $this->actingAsAdmin()
            ->deleteJson("/api/v1/categories/{$category->id}")
            ->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_cashier_cannot_delete_category(): void
    {
        $category = Category::create([
            'company_id' => $this->company->id,
            'name'       => 'No borrar',
            'slug'       => 'no-borrar',
        ]);

        $this->actingAsCashier()
            ->deleteJson("/api/v1/categories/{$category->id}")
            ->assertStatus(403);
    }
}
