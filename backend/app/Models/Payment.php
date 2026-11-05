<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use BelongsToCompany, HasFactory;

    protected $fillable = [
        'company_id',
        'sale_id',
        'cash_session_id',
        'payment_method',
        'amount',
        'tendered',
        'change',
        'reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount'   => 'decimal:2',
            'tendered' => 'decimal:2',
            'change'   => 'decimal:2',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }
}
