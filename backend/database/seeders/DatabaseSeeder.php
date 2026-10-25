<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Empresa Principal
        $company = Company::updateOrCreate(
            ['tax_id' => '901.845.123-4'],
            [
                'name' => 'Zentry Tech Store',
                'legal_name' => 'Zentry Soluciones S.A.S.',
                'email' => 'contacto@zentrypos.com',
                'phone' => '+57 (300) 123-4567',
                'address' => 'Cra. 43A #1-50, Medellín, Colombia',
                'currency' => 'COP',
                'default_tax_rate' => 19.00,
                'invoice_prefix' => 'FV-',
                'next_invoice_number' => 153,
                'status' => 'active',
            ]
        );

        // 2. Usuarios Demo
        $users = [
            [
                'name' => 'Carlos Rodríguez',
                'email' => 'carlos@zentrypos.com',
                'role' => 'admin',
                'status' => 'active',
                'avatar' => 'CR',
                'phone' => '+57 320 222 2222',
            ],
            [
                'name' => 'María González',
                'email' => 'maria@zentrypos.com',
                'role' => 'cashier',
                'status' => 'active',
                'avatar' => 'MG',
                'phone' => '+57 311 111 1111',
            ],
            [
                'name' => 'Juan Pérez',
                'email' => 'juan@zentrypos.com',
                'role' => 'inventory',
                'status' => 'active',
                'avatar' => 'JP',
                'phone' => '+57 300 000 0000',
            ],
            [
                'name' => 'Laura Martínez',
                'email' => 'laura@zentrypos.com',
                'role' => 'cashier',
                'status' => 'inactive',
                'avatar' => 'LM',
                'phone' => '+57 315 333 3333',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'company_id' => $company->id,
                    'password' => Hash::make('password123'),
                ])
            );
        }
    }
}
