<?php

namespace App\Http\Requests\Category;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // El middleware 'role' ya filtra acceso
    }

    public function rules(): array
    {
        $companyId = Auth::user()->company_id;

        return [
            'name'       => ['required', 'string', 'max:120'],
            'slug'       => [
                'nullable', 'string', 'max:140',
                Rule::unique('categories')->where('company_id', $companyId),
            ],
            'color'      => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon'       => ['nullable', 'string', 'max:60'],
            'is_active'  => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'  => 'El nombre de la categoría es obligatorio.',
            'slug.unique'    => 'Ya existe una categoría con este slug en tu empresa.',
            'color.regex'    => 'El color debe ser un código hexadecimal válido (ej. #6366f1).',
        ];
    }
}
