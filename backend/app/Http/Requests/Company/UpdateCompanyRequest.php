<?php

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:150'],
            'legal_name'       => ['nullable', 'string', 'max:150'],
            'tax_id'           => ['nullable', 'string', 'max:50'],
            'email'            => ['nullable', 'email', 'max:100'],
            'phone'            => ['nullable', 'string', 'max:50'],
            'address'          => ['nullable', 'string', 'max:255'],
            'logo'             => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'currency'         => ['required', 'string', 'max:10'],
            'default_tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'invoice_prefix'   => ['required', 'string', 'max:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'             => 'El nombre comercial es obligatorio.',
            'currency.required'         => 'La moneda de la empresa es obligatoria.',
            'default_tax_rate.required' => 'La tasa de impuesto por defecto es obligatoria.',
            'invoice_prefix.required'   => 'El prefijo de facturación es obligatorio.',
        ];
    }
}
