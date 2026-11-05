<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private User $admin;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::create([
            'name'     => 'Zentry Store',
            'tax_id'   => '900.001.001-1',
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

        $this->product = Product::create([
            'company_id'  => $this->company->id,
            'name'        => 'Mouse Inalámbrico',
            'sku'         => 'MOU-01',
            'price'       => 50000,
            'cost'        => 30000,
            'stock'       => 1, // Bajo stock
            'stock_min'   => 5,
            'track_stock' => true,
        ]);
    }

    public function test_user_can_get_dashboard_stats_and_kpis(): void
    {
        // Registrar una venta de hoy
        $sale = Sale::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->admin->id,
            'invoice_number' => 'FV-000100',
            'total'          => 100000,
            'status'         => 'completed',
            'created_at'     => now(),
        ]);

        SaleItem::create([
            'company_id'   => $this->company->id,
            'sale_id'      => $sale->id,
            'product_id'   => $this->product->id,
            'product_name' => $this->product->name,
            'quantity'     => 2,
            'unit_price'   => 50000,
            'unit_cost'    => 30000,
            'total'        => 100000,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kpis.today_sales', 100000)
            ->assertJsonPath('data.kpis.today_count', 1)
            ->assertJsonPath('data.top_products.0.name', 'Mouse Inalámbrico')
            ->assertJsonPath('data.low_stock_alerts.0.name', 'Mouse Inalámbrico');
    }

    public function test_user_can_get_reports_summary(): void
    {
        $sale = Sale::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->admin->id,
            'invoice_number' => 'FV-000100',
            'total'          => 100000,
            'status'         => 'completed',
            'created_at'     => now(),
        ]);

        SaleItem::create([
            'company_id'   => $this->company->id,
            'sale_id'      => $sale->id,
            'product_id'   => $this->product->id,
            'product_name' => $this->product->name,
            'quantity'     => 2,
            'unit_price'   => 50000,
            'unit_cost'    => 30000,
            'total'        => 100000, // Ganancia bruta: 100000 - 60000 = 40000 (40%)
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/reports/summary');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.total_revenue', 100000)
            ->assertJsonPath('data.summary.gross_margin', 40000)
            ->assertJsonPath('data.summary.gross_margin_percentage', 40);
    }
}
