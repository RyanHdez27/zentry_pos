<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId  = Auth::user()->company_id;
        $customerId = $this->route('customer') instanceof \App\Models\Customer
            ? $this->route('customer')->id
            : $this->route('customer');

        return [
            'document_type'   => ['nullable', 'string', 'max:20'],
            'document_number' => [
                'required', 'string', 'max:50',
                Rule::unique('customers')
                    ->where('company_id', $companyId)
                    ->whereNull('deleted_at')
                    ->ignore($customerId),
            ],
            'name'            => ['required', 'string', 'max:200'],
            'business_name'   => ['nullable', 'string', 'max:200'],
            'email'           => ['nullable', 'email', 'max:150'],
            'phone'           => ['nullable', 'string', 'max:50'],
            'address'         => ['nullable', 'string', 'max:255'],
            'city'            => ['nullable', 'string', 'max:100'],
            'credit_limit'    => ['nullable', 'numeric', 'min:0'],
            'current_balance' => ['nullable', 'numeric'],
            'is_active'       => ['boolean'],
            'notes'           => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'document_number.required' => 'El número de documento es obligatorio.',
            'document_number.unique'   => 'Ya existe otro cliente con este documento en su empresa.',
            'name.required'            => 'El nombre o razón del cliente es obligatorio.',
            'email.email'              => 'El formato del correo electrónico es inválido.',
            'credit_limit.min'         => 'El límite de crédito no puede ser negativo.',
        ];
    }
}
