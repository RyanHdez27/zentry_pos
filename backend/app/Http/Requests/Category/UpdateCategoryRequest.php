<?php

namespace App\Http\Requests\Category;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId  = Auth::user()->company_id;
        $categoryId = $this->route('category');

        return [
            'name'       => ['sometimes', 'string', 'max:120'],
            'slug'       => [
                'sometimes', 'string', 'max:140',
                Rule::unique('categories')
                    ->where('company_id', $companyId)
                    ->ignore($categoryId),
            ],
            'color'      => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon'       => ['sometimes', 'nullable', 'string', 'max:60'],
            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.unique' => 'Ya existe una categoría con este slug en tu empresa.',
            'color.regex' => 'El color debe ser un código hexadecimal válido (ej. #6366f1).',
        ];
    }
}
