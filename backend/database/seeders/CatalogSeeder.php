<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Company;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::where('tax_id', '901.845.123-4')->first();

        if (! $company) {
            $this->command->warn('No se encontró la empresa demo. Ejecuta primero DatabaseSeeder.');
            return;
        }

        // ─── Categorías demo ─────────────────────────────────────────────────
        $categoriesData = [
            ['name' => 'Electrónica',    'slug' => 'electronica',    'color' => '#3b82f6', 'icon' => 'Cpu'],
            ['name' => 'Periféricos',    'slug' => 'perifericos',    'color' => '#8b5cf6', 'icon' => 'Mouse'],
            ['name' => 'Accesorios',     'slug' => 'accesorios',     'color' => '#f59e0b', 'icon' => 'Package'],
            ['name' => 'Cables y Hubs',  'slug' => 'cables-y-hubs',  'color' => '#10b981', 'icon' => 'Plug'],
            ['name' => 'Audio y Video',  'slug' => 'audio-y-video',  'color' => '#ef4444', 'icon' => 'Headphones'],
            ['name' => 'Oficina',        'slug' => 'oficina',        'color' => '#64748b', 'icon' => 'Briefcase'],
        ];

        $categories = [];
        foreach ($categoriesData as $i => $data) {
            $categories[$data['slug']] = Category::updateOrCreate(
                ['company_id' => $company->id, 'slug' => $data['slug']],
                array_merge($data, [
                    'company_id' => $company->id,
                    'is_active'  => true,
                    'sort_order' => $i,
                ])
            );
        }

        // ─── Productos demo ──────────────────────────────────────────────────
        $products = [
            [
                'category_slug' => 'electronica',
                'name'          => 'Laptop Lenovo IdeaPad 15"',
                'sku'           => 'LAP-LEN-001',
                'barcode'       => '7501055300013',
                'price'         => 2499000,
                'cost'          => 1900000,
                'tax_rate'      => 19,
                'stock'         => 12,
                'stock_min'     => 3,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'electronica',
                'name'          => 'Tablet Samsung Galaxy A8',
                'sku'           => 'TAB-SAM-001',
                'barcode'       => '7501055300020',
                'price'         => 899000,
                'cost'          => 650000,
                'tax_rate'      => 19,
                'stock'         => 8,
                'stock_min'     => 2,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'perifericos',
                'name'          => 'Mouse Logitech MX Master 3',
                'sku'           => 'MOU-LOG-001',
                'barcode'       => '7501055300037',
                'price'         => 279000,
                'cost'          => 190000,
                'tax_rate'      => 19,
                'stock'         => 25,
                'stock_min'     => 5,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'perifericos',
                'name'          => 'Teclado Mecánico Redragon K552',
                'sku'           => 'TEC-RED-001',
                'barcode'       => '7501055300044',
                'price'         => 189000,
                'cost'          => 130000,
                'tax_rate'      => 19,
                'stock'         => 18,
                'stock_min'     => 4,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'accesorios',
                'name'          => 'Funda Laptop 15.6" Impermeable',
                'sku'           => 'FUN-LAP-001',
                'barcode'       => '7501055300051',
                'price'         => 45000,
                'cost'          => 22000,
                'tax_rate'      => 19,
                'stock'         => 40,
                'stock_min'     => 10,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'cables-y-hubs',
                'name'          => 'Hub USB-C 7 en 1 Anker',
                'sku'           => 'HUB-ANK-001',
                'barcode'       => '7501055300068',
                'price'         => 129000,
                'cost'          => 85000,
                'tax_rate'      => 19,
                'stock'         => 2,   // stock bajo intencional para demo
                'stock_min'     => 5,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'cables-y-hubs',
                'name'          => 'Cable HDMI 2.1 2m',
                'sku'           => 'CAB-HDM-001',
                'barcode'       => '7501055300075',
                'price'         => 35000,
                'cost'          => 18000,
                'tax_rate'      => 19,
                'stock'         => 60,
                'stock_min'     => 10,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'audio-y-video',
                'name'          => 'Audífonos Sony WH-1000XM5',
                'sku'           => 'AUD-SON-001',
                'barcode'       => '7501055300082',
                'price'         => 1199000,
                'cost'          => 880000,
                'tax_rate'      => 19,
                'stock'         => 6,
                'stock_min'     => 2,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'audio-y-video',
                'name'          => 'Webcam Logitech C920 HD Pro',
                'sku'           => 'CAM-LOG-001',
                'barcode'       => '7501055300099',
                'price'         => 349000,
                'cost'          => 240000,
                'tax_rate'      => 19,
                'stock'         => 9,
                'stock_min'     => 3,
                'unit'          => 'unidad',
            ],
            [
                'category_slug' => 'oficina',
                'name'          => 'Silla Ergonómica OfficePro X1',
                'sku'           => 'SIL-OFF-001',
                'barcode'       => '7501055300105',
                'price'         => 750000,
                'cost'          => 490000,
                'tax_rate'      => 19,
                'stock'         => 5,
                'stock_min'     => 2,
                'unit'          => 'unidad',
            ],
        ];

        foreach ($products as $data) {
            $categorySlug = $data['category_slug'];
            unset($data['category_slug']);

            Product::updateOrCreate(
                [
                    'company_id' => $company->id,
                    'sku'        => $data['sku'],
                ],
                array_merge($data, [
                    'company_id'  => $company->id,
                    'category_id' => $categories[$categorySlug]->id ?? null,
                    'is_active'   => true,
                    'track_stock' => true,
                ])
            );
        }

        $this->command->info('✅ Catálogo demo: '.count($categoriesData).' categorías, '.count($products).' productos.');
    }
}
