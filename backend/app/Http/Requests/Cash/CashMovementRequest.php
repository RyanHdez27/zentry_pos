<?php

namespace App\Http\Requests\Cash;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CashMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'        => ['required', 'string', Rule::in(['income', 'expense', 'withdrawal'])],
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:255'],
            'reference'   => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required'        => 'El tipo de movimiento es obligatorio.',
            'type.in'              => 'El tipo debe ser ingreso (income), egreso (expense) o retiro (withdrawal).',
            'amount.required'      => 'El monto es obligatorio.',
            'amount.min'           => 'El monto debe ser superior a cero.',
            'description.required' => 'La descripción o motivo del movimiento es obligatoria.',
        ];
    }
}
