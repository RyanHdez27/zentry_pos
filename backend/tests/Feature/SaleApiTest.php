<?php

namespace Tests\Feature;

use App\Models\CashSession;
use App\Models\Category;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SaleApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;
    private Company $otherCompany;
    private User $cashier;
    private User $admin;
    private User $otherUser;
    private Product $productTracked;
    private Product $productUntracked;
    private Customer $customer;

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
            'next_invoice_number' => 200,
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

        $this->otherUser = User::create([
            'company_id' => $this->otherCompany->id,
            'name'       => 'Otro Cajero',
            'email'      => 'otro@other.com',
            'password'   => Hash::make('password123'),
            'role'       => 'cashier',
            'status'     => 'active',
        ]);

        $category = Category::create([
            'company_id' => $this->company->id,
            'name'       => 'Tecnología',
            'slug'       => 'tecnologia',
        ]);

        $this->productTracked = Product::create([
            'company_id'  => $this->company->id,
            'category_id' => $category->id,
            'name'        => 'Mouse Inalámbrico',
            'sku'         => 'MOU-01',
            'price'       => 50000,
            'cost'        => 30000,
            'stock'       => 10,
            'stock_min'   => 2,
            'track_stock' => true,
            'tax_rate'    => 19,
        ]);

        $this->productUntracked = Product::create([
            'company_id'  => $this->company->id,
            'category_id' => $category->id,
            'name'        => 'Servicio de Mantenimiento',
            'sku'         => 'SRV-01',
            'price'       => 80000,
            'cost'        => 0,
            'stock'       => 0,
            'track_stock' => false,
            'tax_rate'    => 0,
        ]);

        $this->customer = Customer::create([
            'company_id'      => $this->company->id,
            'document_type'   => 'CC',
            'document_number' => '10203040',
            'name'            => 'Andrés Gómez',
            'email'           => 'andres@test.com',
            'credit_limit'    => 200000,
            'current_balance' => 0,
            'is_active'       => true,
        ]);
    }

    public function test_cashier_can_process_sale_with_cash_and_open_session(): void
    {
        // 1. Abrir caja primero
        $session = CashSession::create([
            'company_id'      => $this->company->id,
            'user_id'         => $this->cashier->id,
            'opening_amount'  => 50000,
            'expected_amount' => 50000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $payload = [
            'customer_id'     => $this->customer->id,
            'discount_amount' => 0,
            'items'           => [
                [
                    'product_id' => $this->productTracked->id,
                    'quantity'   => 2,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'cash',
                    'amount'         => 119000, // 2 * 50000 + 19% IVA = 119,000
                    'tendered'       => 120000,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.invoice_number', 'FV-000100')
            ->assertJsonPath('data.total', '119000.00')
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.payment_status', 'paid');

        // Verificar descuento en BD
        $this->assertEquals(8, $this->productTracked->fresh()->stock);

        // Verificar kardex
        $this->assertDatabaseHas('inventory_movements', [
            'company_id' => $this->company->id,
            'product_id' => $this->productTracked->id,
            'type'       => 'sale',
            'quantity'   => -2,
            'reference'  => 'FV-000100',
        ]);

        // Verificar registro en caja
        $this->assertDatabaseHas('cash_movements', [
            'cash_session_id' => $session->id,
            'type'            => 'sale',
            'amount'          => 119000,
            'reference'       => 'FV-000100',
        ]);
    }

    public function test_sale_fails_if_insufficient_stock_for_tracked_product(): void
    {
        CashSession::create([
            'company_id'      => $this->company->id,
            'user_id'         => $this->cashier->id,
            'opening_amount'  => 50000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        // Stock es 10, solicitamos 15
        $payload = [
            'items' => [
                [
                    'product_id' => $this->productTracked->id,
                    'quantity'   => 15,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['quantity']);

        // Stock intacto
        $this->assertEquals(10, $this->productTracked->fresh()->stock);
        $this->assertDatabaseMissing('sales', ['company_id' => $this->company->id]);
    }

    public function test_sale_works_for_untracked_product_even_with_zero_stock(): void
    {
        CashSession::create([
            'company_id'      => $this->company->id,
            'user_id'         => $this->cashier->id,
            'opening_amount'  => 50000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $payload = [
            'items' => [
                [
                    'product_id' => $this->productUntracked->id,
                    'quantity'   => 5,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total', '400000.00'); // 5 * 80000
    }

    public function test_sale_fails_for_cash_payment_if_no_open_cash_session(): void
    {
        // Sin sesión de caja abierta
        $payload = [
            'items' => [
                [
                    'product_id' => $this->productTracked->id,
                    'quantity'   => 1,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'cash',
                    'amount'         => 59500,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cash_session']);
    }

    public function test_sale_with_card_does_not_require_cash_session(): void
    {
        $payload = [
            'items' => [
                [
                    'product_id' => $this->productTracked->id,
                    'quantity'   => 1,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'card',
                    'amount'         => 59500,
                    'reference'      => 'POS-VISA-9912',
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.payments.0.payment_method', 'card')
            ->assertJsonPath('data.payments.0.reference', 'POS-VISA-9912');

        $this->assertEquals(9, $this->productTracked->fresh()->stock);
    }

    public function test_sale_with_customer_credit_updates_customer_balance(): void
    {
        $payload = [
            'customer_id' => $this->customer->id,
            'items'       => [
                [
                    'product_id' => $this->productTracked->id,
                    'quantity'   => 1,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'credit',
                    'amount'         => 59500,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales', $payload);

        $response->assertStatus(201);
        $this->assertEquals(59500, (float) $this->customer->fresh()->current_balance);
    }

    public function test_sale_fails_if_credit_limit_exceeded(): void
    {
        $this->customer->update(['credit_limit' => 50000, 'current_balance' => 0]);

        $payload = [
            'customer_id' => $this->customer->id,
            'items'       => [
                [
                    'product_id' => $this->productTracked->id,
                    'quantity'   => 1, // Total con IVA = 59500 > 50000 cupo
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'credit',
                    'amount'         => 59500,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/v1/sales', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['credit']);
    }

    public function test_invoice_numbers_increment_atomically(): void
    {
        CashSession::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'opening_amount' => 50000,
            'status'         => 'open',
            'opened_at'      => now(),
        ]);

        $payload = [
            'items' => [['product_id' => $this->productTracked->id, 'quantity' => 1]],
        ];

        $res1 = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/v1/sales', $payload);
        $res1->assertStatus(201)->assertJsonPath('data.invoice_number', 'FV-000100');

        $res2 = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/v1/sales', $payload);
        $res2->assertStatus(201)->assertJsonPath('data.invoice_number', 'FV-000101');
    }

    public function test_admin_can_cancel_sale_and_restores_stock_and_cash(): void
    {
        $session = CashSession::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'opening_amount' => 50000,
            'status'         => 'open',
            'opened_at'      => now(),
        ]);

        $payload = [
            'items' => [['product_id' => $this->productTracked->id, 'quantity' => 2]],
        ];

        $createRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/v1/sales', $payload);
        $saleId = $createRes->json('data.id');
        $this->assertEquals(8, $this->productTracked->fresh()->stock);

        // Cancelar venta como admin
        $cancelRes = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/sales/{$saleId}/cancel", [
                'reason' => 'Cliente canceló el pedido por demora',
            ]);

        $cancelRes->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'cancelled');

        // Stock restituido a 10
        $this->assertEquals(10, $this->productTracked->fresh()->stock);

        // Movimiento de restitución en kardex
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $this->productTracked->id,
            'type'       => 'return',
            'quantity'   => 2,
        ]);

        // Movimiento de anulación en caja
        $this->assertDatabaseHas('cash_movements', [
            'cash_session_id' => $session->id,
            'type'            => 'cancellation',
            'amount'          => 119000,
        ]);
    }

    public function test_cashier_cannot_cancel_sale(): void
    {
        $sale = Sale::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'invoice_number' => 'FV-000099',
            'total'          => 50000,
            'status'         => 'completed',
        ]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/sales/{$sale->id}/cancel", [
                'reason' => 'Intento de cajero',
            ]);

        $response->assertStatus(403);
    }

    public function test_sales_are_isolated_between_companies(): void
    {
        $saleComp1 = Sale::create([
            'company_id'     => $this->company->id,
            'user_id'        => $this->cashier->id,
            'invoice_number' => 'FV-000100',
            'total'          => 10000,
            'status'         => 'completed',
        ]);

        $saleComp2 = Sale::create([
            'company_id'     => $this->otherCompany->id,
            'user_id'        => $this->otherUser->id,
            'invoice_number' => 'FV-000200',
            'total'          => 20000,
            'status'         => 'completed',
        ]);

        $res = $this->actingAs($this->cashier, 'sanctum')->getJson('/api/v1/sales');
        $res->assertStatus(200);

        $ids = collect($res->json('data'))->pluck('id')->all();
        $this->assertContains($saleComp1->id, $ids);
        $this->assertNotContains($saleComp2->id, $ids);

        // Intentar ver la venta de otra empresa da 404
        $resShow = $this->actingAs($this->cashier, 'sanctum')->getJson("/api/v1/sales/{$saleComp2->id}");
        $resShow->assertStatus(404);
    }
}
