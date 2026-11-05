<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = Auth::user()->company_id;

        return [
            'name'        => ['required', 'string', 'max:200'],
            'category_id' => [
                'nullable', 'integer',
                Rule::exists('categories', 'id')->where('company_id', $companyId),
            ],
            'sku'         => [
                'nullable', 'string', 'max:80',
                Rule::unique('products')->where('company_id', $companyId)->whereNull('deleted_at'),
            ],
            'barcode'     => [
                'nullable', 'string', 'max:100',
                Rule::unique('products')->where('company_id', $companyId)->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'price'       => ['required', 'numeric', 'min:0'],
            'cost'        => ['nullable', 'numeric', 'min:0'],
            'tax_rate'    => ['nullable', 'numeric', 'min:0', 'max:100'],
            'stock'       => ['nullable', 'numeric', 'min:0'],
            'stock_min'   => ['nullable', 'numeric', 'min:0'],
            'unit'        => ['nullable', 'string', 'max:40'],
            'is_active'   => ['boolean'],
            'track_stock' => ['boolean'],
            'image_url'   => ['nullable', 'url', 'max:500'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'El nombre del producto es obligatorio.',
            'price.required'    => 'El precio de venta es obligatorio.',
            'price.min'         => 'El precio no puede ser negativo.',
            'sku.unique'        => 'Ya existe un producto con este SKU en tu empresa.',
            'barcode.unique'    => 'Ya existe un producto con este código de barras.',
            'category_id.exists'=> 'La categoría seleccionada no existe o no pertenece a tu empresa.',
        ];
    }
}
