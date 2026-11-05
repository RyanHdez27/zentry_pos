<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::where('tax_id', '901.845.123-4')->first() ?? Company::first();

        if (! $company) {
            return;
        }

        $customers = [
            [
                'document_type'   => 'CC',
                'document_number' => '222222222222',
                'name'            => 'Consumidor Final',
                'business_name'   => null,
                'email'           => 'consumidor@zentrypos.com',
                'phone'           => '000 000 0000',
                'address'         => 'Ventas de mostrador',
                'city'            => 'Medellín',
                'credit_limit'    => 0,
                'current_balance' => 0,
                'is_active'       => true,
                'notes'           => 'Cliente genérico para ventas al público sin identificación específica.',
            ],
            [
                'document_type'   => 'CC',
                'document_number' => '12345678',
                'name'            => 'Juan Pérez',
                'business_name'   => null,
                'email'           => 'juan@email.com',
                'phone'           => '+57 300 000 0000',
                'address'         => 'Calle 10 #40-20',
                'city'            => 'Medellín',
                'credit_limit'    => 1500000,
                'current_balance' => 0,
                'is_active'       => true,
                'notes'           => 'Cliente frecuente de periféricos.',
            ],
            [
                'document_type'   => 'CC',
                'document_number' => '23456789',
                'name'            => 'María González',
                'business_name'   => null,
                'email'           => 'maria@email.com',
                'phone'           => '+57 311 111 1111',
                'address'         => 'Carrera 70 #32-15',
                'city'            => 'Medellín',
                'credit_limit'    => 800000,
                'current_balance' => 0,
                'is_active'       => true,
                'notes'           => null,
            ],
            [
                'document_type'   => 'NIT',
                'document_number' => '900888777-1',
                'name'            => 'Carlos Rodríguez',
                'business_name'   => 'Rodríguez Tech Solutions S.A.S.',
                'email'           => 'carlos@email.com',
                'phone'           => '+57 320 222 2222',
                'address'         => 'Av. El Poblado #5A-110',
                'city'            => 'Medellín',
                'credit_limit'    => 5000000,
                'current_balance' => 0,
                'is_active'       => true,
                'notes'           => 'Cliente corporativo con línea de crédito aprobada.',
            ],
            [
                'document_type'   => 'CC',
                'document_number' => '45678901',
                'name'            => 'Laura Martínez',
                'business_name'   => null,
                'email'           => 'laura@email.com',
                'phone'           => '+57 315 333 3333',
                'address'         => 'Circular 4 #73-08',
                'city'            => 'Medellín',
                'credit_limit'    => 0,
                'current_balance' => 0,
                'is_active'       => false,
                'notes'           => 'Cuenta inactiva por solicitud del cliente.',
            ],
            [
                'document_type'   => 'CC',
                'document_number' => '56789012',
                'name'            => 'Andrés Gómez',
                'business_name'   => null,
                'email'           => 'andres@email.com',
                'phone'           => '+57 317 444 4444',
                'address'         => 'Transversal 39 #76-12',
                'city'            => 'Medellín',
                'credit_limit'    => 2000000,
                'current_balance' => 0,
                'is_active'       => true,
                'notes'           => null,
            ],
        ];

        foreach ($customers as $data) {
            Customer::updateOrCreate(
                [
                    'company_id'      => $company->id,
                    'document_number' => $data['document_number'],
                ],
                $data
            );
        }
    }
}
