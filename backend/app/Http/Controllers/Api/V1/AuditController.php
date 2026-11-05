<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\InventoryMovement;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    /**
     * GET /api/v1/audit/logs
     * Bitácora unificada de actividad crítica del sistema (Ventas, Inventario, Caja).
     */
    public function logs(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        // 1. Actividad de Ventas
        $salesLogs = Sale::where('company_id', $companyId)
            ->with(['user', 'customer'])
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn ($s) => [
                'id'          => 'sale-' . $s->id,
                'user'        => $s->user?->name ?? 'Sistema',
                'action'      => $s->status === 'cancelled' ? 'Anulación de venta' : 'Venta procesada',
                'module'      => 'POS',
                'description' => "Comprobante {$s->invoice_number} por " . number_format((float) $s->total, 2) . " ({$s->payment_status})",
                'timestamp'   => $s->created_at->toIso8601String(),
                'date'        => $s->created_at->format('d/m/Y H:i'),
            ]);

        // 2. Actividad de Inventario
        $invLogs = InventoryMovement::where('company_id', $companyId)
            ->with(['user', 'product'])
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn ($m) => [
                'id'          => 'inv-' . $m->id,
                'user'        => $m->user?->name ?? 'Sistema',
                'action'      => "Movimiento: " . ucfirst($m->type),
                'module'      => 'Inventario',
                'description' => "{$m->product?->name}: {$m->quantity} uds ({$m->reason})",
                'timestamp'   => $m->created_at->toIso8601String(),
                'date'        => $m->created_at->format('d/m/Y H:i'),
            ]);

        // 3. Actividad de Caja
        $cashLogs = CashMovement::where('company_id', $companyId)
            ->with(['user'])
            ->latest()
            ->limit(15)
            ->get()
            ->map(fn ($c) => [
                'id'          => 'cash-' . $c->id,
                'user'        => $c->user?->name ?? 'Cajero',
                'action'      => "Caja: " . ucfirst($c->type),
                'module'      => 'Caja',
                'description' => "{$c->description} (" . number_format((float) $c->amount, 2) . ")",
                'timestamp'   => $c->created_at->toIso8601String(),
                'date'        => $c->created_at->format('d/m/Y H:i'),
            ]);

        // Combinar y ordenar cronológicamente
        $combined = collect([...$salesLogs, ...$invLogs, ...$cashLogs])
            ->sortByDesc('timestamp')
            ->values()
            ->take(30);

        return response()->json([
            'success' => true,
            'data'    => $combined,
        ]);
    }
}
