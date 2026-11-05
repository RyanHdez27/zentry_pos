<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Company;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoCompanySeeder extends Seeder
{
    public function run(): void
    {
        $credentials = [];
        DB::transaction(function () use (&$credentials) {
            $company = Company::firstOrCreate(['tax_id' => 'DEMO-ZENTRY-001'], [
                'name' => 'Demo Tech Store',
                'legal_name' => 'Demo Tech Store S.A.S.',
                'email' => 'contacto@demotech.example',
                'phone' => '+57 300 555 0100',
                'address' => 'Empresa de demostración · Colombia',
                'currency' => 'COP',
                'default_tax_rate' => 19,
                'invoice_prefix' => 'DT-',
                'next_invoice_number' => 1,
                'status' => 'active',
                'modules' => ['dashboard', 'pos', 'products', 'inventory', 'customers', 'cash', 'invoices', 'reports', 'users', 'roles', 'settings', 'audit'],
            ]);
            if ($company->modules === null) {
                $company->update(['modules' => ['dashboard', 'pos', 'products', 'inventory', 'customers', 'cash', 'invoices', 'reports', 'users', 'roles', 'settings', 'audit']]);
            }

            foreach ([
                ['name' => 'Administrador Demo', 'email' => 'admin@demotech.example', 'role' => 'admin'],
                ['name' => 'Vendedor Demo', 'email' => 'vendedor@demotech.example', 'role' => 'cashier'],
            ] as $account) {
                if (! User::where('email', $account['email'])->exists()) {
                    $password = Str::password(20);
                    $company->users()->create($account + ['password' => $password, 'status' => 'active']);
                    $credentials[] = [$account['role'], $account['email'], $password];
                }
            }

            $catalog = [
                'Computadores' => [
                    ['Laptop Lenovo IdeaPad 3', 'TEC-LAP-001', 2299000, 1850000, 12],
                    ['Laptop ASUS VivoBook 15', 'TEC-LAP-002', 2799000, 2240000, 8],
                    ['Monitor LG 24 pulgadas', 'TEC-MON-001', 849000, 620000, 15],
                ],
                'Periféricos' => [
                    ['Mouse Logitech M185', 'TEC-MOU-001', 79900, 45000, 32],
                    ['Teclado mecánico Redragon', 'TEC-TEC-001', 219900, 145000, 18],
                    ['Webcam Logitech C920', 'TEC-CAM-001', 329900, 245000, 10],
                    ['Audífonos JBL Tune 520BT', 'TEC-AUD-001', 189900, 129000, 22],
                ],
                'Accesorios' => [
                    ['Hub USB-C 7 en 1', 'TEC-HUB-001', 149900, 89000, 20],
                    ['SSD externo 1 TB', 'TEC-SSD-001', 399900, 295000, 14],
                    ['Cable HDMI 2 m', 'TEC-CAB-001', 29900, 12000, 40],
                    ['Cargador USB-C 65 W', 'TEC-CAR-001', 119900, 68000, 25],
                ],
            ];

            foreach ($catalog as $categoryName => $items) {
                $category = Category::firstOrCreate(
                    ['company_id' => $company->id, 'slug' => Str::slug($categoryName)],
                    ['name' => $categoryName, 'color' => '#2563eb', 'is_active' => true]
                );
                foreach ($items as [$name, $sku, $price, $cost, $stock]) {
                    Product::firstOrCreate(['company_id' => $company->id, 'sku' => $sku], [
                        'category_id' => $category->id,
                        'name' => $name,
                        'description' => 'Producto de catálogo para demostraciones de Zentry POS.',
                        'price' => $price,
                        'cost' => $cost,
                        'tax_rate' => 19,
                        'stock' => $stock,
                        'stock_min' => 3,
                        'unit' => 'unidad',
                        'is_active' => true,
                        'track_stock' => true,
                    ]);
                }
            }
        });

        $this->command?->info('Empresa Demo Tech Store lista con administrador, vendedor y catálogo.');
        foreach ($credentials as [$role, $email, $password]) {
            $this->command?->line("Credencial inicial ({$role}) {$email} / {$password}");
        }
        if ($credentials === []) $this->command?->line('Las cuentas demo ya existían; sus contraseñas no fueron modificadas.');
    }
}
