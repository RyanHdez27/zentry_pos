<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('user');

        return [
            'name'     => ['sometimes', 'required', 'string', 'max:100'],
            'email'    => ['sometimes', 'required', 'email', 'max:100', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:6'],
            'role'     => ['sometimes', 'required', 'string', Rule::in(['admin', 'cashier', 'inventory'])],
            'phone'    => ['nullable', 'string', 'max:50'],
            'status'   => ['sometimes', 'required', 'string', Rule::in(['active', 'inactive'])],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'El nombre del usuario es obligatorio.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.unique'   => 'Este correo electrónico ya se encuentra registrado por otro usuario.',
            'role.in'        => 'El rol seleccionado no es válido (admin, cashier o inventory).',
        ];
    }
}
