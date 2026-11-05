<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CreateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = Auth::user()->company_id;

        return [
            'customer_id' => [
                'nullable',
                'integer',
                Rule::exists('customers', 'id')
                    ->where('company_id', $companyId)
                    ->whereNull('deleted_at'),
            ],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'notes'           => ['nullable', 'string', 'max:500'],

            'items'                    => ['required', 'array', 'min:1'],
            'items.*.product_id'       => [
                'required',
                'integer',
                Rule::exists('products', 'id')
                    ->where('company_id', $companyId)
                    ->whereNull('deleted_at'),
            ],
            'items.*.quantity'        => ['required', 'numeric', 'min:0.001'],
            'items.*.unit_price'      => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],

            'payments'                  => ['nullable', 'array'],
            'payments.*.payment_method' => ['required_with:payments', 'string', Rule::in(['cash', 'card', 'transfer', 'credit', 'other'])],
            'payments.*.amount'         => ['nullable', 'numeric', 'min:0'],
            'payments.*.tendered'       => ['nullable', 'numeric', 'min:0'],
            'payments.*.reference'      => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'           => 'Debe incluir al menos un producto en la venta.',
            'items.min'                => 'Debe incluir al menos un producto en la venta.',
            'items.*.product_id.exists'=> 'Uno de los productos seleccionados no existe o no pertenece a la empresa.',
            'items.*.quantity.min'     => 'La cantidad vendida debe ser mayor a 0.',
        ];
    }
}
