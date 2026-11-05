<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use BelongsToCompany, SoftDeletes;

    protected $fillable = [
        'company_id',
        'document_type',
        'document_number',
        'name',
        'business_name',
        'email',
        'phone',
        'address',
        'city',
        'credit_limit',
        'current_balance',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit'    => 'decimal:2',
            'current_balance' => 'decimal:2',
            'is_active'       => 'boolean',
        ];
    }
}
