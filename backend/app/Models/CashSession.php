<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashSession extends Model
{
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'opening_amount',
        'closing_amount',
        'expected_amount',
        'difference',
        'status',
        'opened_at',
        'closed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'opening_amount'  => 'decimal:2',
            'closing_amount'  => 'decimal:2',
            'expected_amount' => 'decimal:2',
            'difference'      => 'decimal:2',
            'opened_at'       => 'datetime',
            'closed_at'       => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(CashMovement::class)->orderBy('created_at', 'desc');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed(Builder $query): Builder
    {
        return $query->where('status', 'closed');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Calcula en tiempo real el efectivo esperado en caja.
     * Apertura + Ventas (efectivo) + Ingresos manuales - Egresos/Retiros manuales - Anulaciones
     */
    public function calculateExpectedCash(): float
    {
        $opening = (float) $this->opening_amount;

        $incomes = (float) $this->movements()
            ->whereIn('type', ['income', 'sale'])
            ->sum('amount');

        $outflows = (float) $this->movements()
            ->whereIn('type', ['withdrawal', 'expense', 'cancellation'])
            ->sum('amount');

        return $opening + $incomes - $outflows;
    }
}
