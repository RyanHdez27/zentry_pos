<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = Auth::user()->company_id;

        return [
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')
                    ->where('company_id', $companyId)
                    ->whereNull('deleted_at'),
            ],
            'type' => [
                'required',
                'string',
                Rule::in(['entry', 'exit', 'adjustment', 'damage']),
            ],
            'quantity' => [
                'required',
                'numeric',
                'min:0.001',
            ],
            'reason' => [
                'required',
                'string',
                'max:150',
            ],
            'reference' => [
                'nullable',
                'string',
                'max:100',
            ],
            'unit_cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'El producto es obligatorio.',
            'product_id.exists'   => 'El producto seleccionado no existe o no pertenece a tu empresa.',
            'type.required'       => 'El tipo de movimiento es obligatorio.',
            'type.in'             => 'El tipo de movimiento debe ser entrada (entry), salida (exit), ajuste (adjustment) o baja por daño (damage).',
            'quantity.required'   => 'La cantidad es obligatoria.',
            'quantity.min'        => 'La cantidad debe ser mayor a cero.',
            'reason.required'     => 'El motivo o concepto es obligatorio.',
        ];
    }
}
