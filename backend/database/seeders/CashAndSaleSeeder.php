<?php

namespace Database\Seeders;

use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class CashAndSaleSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::where('tax_id', '901.845.123-4')->first();
        if (! $company) {
            return;
        }

        $admin = User::where('company_id', $company->id)->where('email', 'carlos@zentrypos.com')->first();
        $cashier = User::where('company_id', $company->id)->where('email', 'maria@zentrypos.com')->first();
        $customerJuan = Customer::where('company_id', $company->id)->first();
        $products = Product::where('company_id', $company->id)->get();

        if ($products->isEmpty()) {
            return;
        }

        // 1. Crear sesión de caja abierta para Carlos (Admin)
        $session = CashSession::firstOrCreate(
            [
                'company_id' => $company->id,
                'user_id'    => $admin->id,
                'status'     => 'open',
            ],
            [
                'opening_amount'  => 200000,
                'expected_amount' => 2100000,
                'opened_at'       => now()->startOfDay()->addHours(8),
                'notes'           => 'Turno principal Zentry',
            ]
        );

        // Movimiento de apertura
        CashMovement::firstOrCreate(
            [
                'cash_session_id' => $session->id,
                'reference'       => 'APERTURA',
            ],
            [
                'company_id'  => $company->id,
                'user_id'     => $admin->id,
                'type'        => 'income',
                'amount'      => 200000,
                'description' => 'Apertura de caja — monto inicial',
                'created_at'  => now()->startOfDay()->addHours(8),
            ]
        );

        // 2. Crear un par de ventas demo
        $p1 = $products->first();
        $p2 = $products->skip(1)->first() ?? $p1;

        if (! Sale::where('company_id', $company->id)->where('invoice_number', 'FV-000150')->exists()) {
            $subtotal1 = (float) $p1->price * 2;
            $tax1 = round($subtotal1 * 0.19, 2);
            $total1 = $subtotal1 + $tax1;

            $sale1 = Sale::create([
                'company_id'      => $company->id,
                'user_id'         => $admin->id,
                'customer_id'     => $customerJuan?->id,
                'cash_session_id' => $session->id,
                'invoice_number'  => 'FV-000150',
                'subtotal'        => $subtotal1,
                'tax_amount'      => $tax1,
                'discount_amount' => 0,
                'total'           => $total1,
                'status'          => 'completed',
                'payment_status'  => 'paid',
                'created_at'      => now()->startOfDay()->addHours(9)->addMinutes(15),
            ]);

            SaleItem::create([
                'company_id'      => $company->id,
                'sale_id'         => $sale1->id,
                'product_id'      => $p1->id,
                'product_name'    => $p1->name,
                'product_sku'     => $p1->sku,
                'quantity'        => 2,
                'unit_price'      => $p1->price,
                'unit_cost'       => $p1->cost,
                'tax_rate'        => 19,
                'tax_amount'      => $tax1,
                'discount_amount' => 0,
                'subtotal'        => $subtotal1,
                'total'           => $total1,
                'created_at'      => now()->startOfDay()->addHours(9)->addMinutes(15),
            ]);

            Payment::create([
                'company_id'      => $company->id,
                'sale_id'         => $sale1->id,
                'cash_session_id' => $session->id,
                'payment_method'  => 'cash',
                'amount'          => $total1,
                'tendered'        => $total1,
                'change'          => 0,
                'created_at'      => now()->startOfDay()->addHours(9)->addMinutes(15),
            ]);

            CashMovement::create([
                'company_id'      => $company->id,
                'cash_session_id' => $session->id,
                'user_id'         => $admin->id,
                'type'            => 'sale',
                'amount'          => $total1,
                'description'     => 'Venta #FV-000150',
                'reference'       => 'FV-000150',
                'created_at'      => now()->startOfDay()->addHours(9)->addMinutes(15),
            ]);
        }

        // Movimiento manual de retiro
        CashMovement::firstOrCreate(
            [
                'cash_session_id' => $session->id,
                'reference'       => 'RET-001',
            ],
            [
                'company_id'  => $company->id,
                'user_id'     => $admin->id,
                'type'        => 'withdrawal',
                'amount'      => 50000,
                'description' => 'Retiro parcial para compras menores',
                'reference'   => 'RET-001',
                'created_at'  => now()->startOfDay()->addHours(10)->addMinutes(30),
            ]
        );

        // Movimiento manual de ingreso
        CashMovement::firstOrCreate(
            [
                'cash_session_id' => $session->id,
                'reference'       => 'ING-001',
            ],
            [
                'company_id'  => $company->id,
                'user_id'     => $admin->id,
                'type'        => 'income',
                'amount'      => 100000,
                'description' => 'Pago de saldo cliente',
                'reference'   => 'ING-001',
                'created_at'  => now()->startOfDay()->addHours(11)->addMinutes(00),
            ]
        );
    }
}
