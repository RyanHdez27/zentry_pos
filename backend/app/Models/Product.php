<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use BelongsToCompany, SoftDeletes;

    protected $fillable = [
        'company_id',
        'category_id',
        'name',
        'sku',
        'barcode',
        'description',
        'price',
        'cost',
        'tax_rate',
        'stock',
        'stock_min',
        'unit',
        'is_active',
        'track_stock',
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'price'       => 'decimal:2',
            'cost'        => 'decimal:2',
            'tax_rate'    => 'decimal:2',
            'stock'       => 'decimal:3',
            'stock_min'   => 'decimal:3',
            'is_active'   => 'boolean',
            'track_stock' => 'boolean',
        ];
    }

    // ─── Relaciones ───────────────────────────────────────────────────────────

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Precio final con impuesto incluido.
     */
    public function getPriceWithTaxAttribute(): string
    {
        $taxMultiplier = 1 + ((float) $this->tax_rate / 100);
        return number_format((float) $this->price * $taxMultiplier, 2, '.', '');
    }

    /**
     * ¿Está en stock bajo?
     */
    public function isLowStock(): bool
    {
        return $this->track_stock && (float) $this->stock <= (float) $this->stock_min;
    }

    /**
     * ¿Tiene stock disponible para vender?
     */
    public function hasStock(float $quantity = 1): bool
    {
        if (! $this->track_stock) {
            return true;
        }

        return (float) $this->stock >= $quantity;
    }
}
