<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'company_id',
        'sale_id',
        'product_id',
        'product_name',
        'product_sku',
        'quantity',
        'unit_price',
        'unit_cost',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'subtotal',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'quantity'        => 'decimal:3',
            'unit_price'      => 'decimal:2',
            'unit_cost'       => 'decimal:2',
            'tax_rate'        => 'decimal:2',
            'tax_amount'      => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'subtotal'        => 'decimal:2',
            'total'           => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
