<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = Auth::user()->company_id;
        $productId = $this->route('product');

        return [
            'name'        => ['sometimes', 'string', 'max:200'],
            'category_id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('categories', 'id')->where('company_id', $companyId),
            ],
            'sku'         => [
                'sometimes', 'nullable', 'string', 'max:80',
                Rule::unique('products')
                    ->where('company_id', $companyId)
                    ->whereNull('deleted_at')
                    ->ignore($productId),
            ],
            'barcode'     => [
                'sometimes', 'nullable', 'string', 'max:100',
                Rule::unique('products')
                    ->where('company_id', $companyId)
                    ->whereNull('deleted_at')
                    ->ignore($productId),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'price'       => ['sometimes', 'numeric', 'min:0'],
            'cost'        => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'tax_rate'    => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'stock'       => ['sometimes', 'numeric', 'min:0'],
            'stock_min'   => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'unit'        => ['sometimes', 'nullable', 'string', 'max:40'],
            'is_active'   => ['sometimes', 'boolean'],
            'track_stock' => ['sometimes', 'boolean'],
            'image_url'   => ['sometimes', 'nullable', 'url', 'max:500'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'price.min'          => 'El precio no puede ser negativo.',
            'sku.unique'         => 'Ya existe un producto con este SKU en tu empresa.',
            'barcode.unique'     => 'Ya existe un producto con este código de barras.',
            'category_id.exists' => 'La categoría seleccionada no existe o no pertenece a tu empresa.',
        ];
    }
}
