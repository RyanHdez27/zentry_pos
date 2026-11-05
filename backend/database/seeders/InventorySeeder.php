<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::where('tax_id', '901.845.123-4')->first();

        if (! $company) {
            return;
        }

        $admin = User::where('company_id', $company->id)->where('role', 'admin')->first();
        $inventoryUser = User::where('company_id', $company->id)->where('role', 'inventory')->first();

        $products = Product::where('company_id', $company->id)->get();

        foreach ($products as $product) {
            // Si ya tiene movimientos registrados, omitir
            if (InventoryMovement::where('product_id', $product->id)->exists()) {
                continue;
            }

            $currentStock = (float) $product->stock;

            // 1. Entrada de inventario inicial
            $initialQty = $currentStock + 5;
            InventoryMovement::create([
                'company_id'     => $company->id,
                'product_id'     => $product->id,
                'user_id'        => $admin?->id,
                'type'           => 'entry',
                'quantity'       => $initialQty,
                'previous_stock' => 0,
                'current_stock'  => $initialQty,
                'unit_cost'      => $product->cost,
                'reason'         => 'Carga inicial de inventario',
                'reference'      => 'INI-2026',
                'created_at'     => now()->subDays(15),
            ]);

            // 2. Movimiento reciente para demostrar kardex
            if ($currentStock > 0) {
                InventoryMovement::create([
                    'company_id'     => $company->id,
                    'product_id'     => $product->id,
                    'user_id'        => $inventoryUser?->id ?? $admin?->id,
                    'type'           => 'sale',
                    'quantity'       => -5,
                    'previous_stock' => $initialQty,
                    'current_stock'  => $currentStock,
                    'unit_cost'      => $product->cost,
                    'reason'         => 'Venta en mostrador',
                    'reference'      => 'POS-DEMO',
                    'created_at'     => now()->subDays(2),
                ]);
            }
        }
    }
}
