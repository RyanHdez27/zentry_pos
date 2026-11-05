<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\AdjustStockRequest;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * GET /api/v1/inventory/summary
     * Resumen de métricas de existencias y valorización.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();
        $summary = $this->inventoryService->getSummary($user->company_id);

        return response()->json([
            'success' => true,
            'data'    => $summary,
        ]);
    }

    /**
     * GET /api/v1/inventory/movements
     * Kardex histórico de movimientos con filtros y paginación.
     */
    public function movements(Request $request): JsonResponse
    {
        $query = InventoryMovement::with([
            'product:id,name,sku,barcode,unit',
            'user:id,name',
        ]);

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $query->where(function ($q) use ($term) {
                $q->where('reason', 'like', $term)
                  ->orWhere('reference', 'like', $term)
                  ->orWhereHas('product', function ($pq) use ($term) {
                      $pq->where('name', 'like', $term)
                         ->orWhere('sku', 'like', $term);
                  });
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min((int) ($request->per_page ?? 25), 100);
        $movements = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $movements->items(),
            'meta'    => [
                'current_page' => $movements->currentPage(),
                'last_page'    => $movements->lastPage(),
                'per_page'     => $movements->perPage(),
                'total'        => $movements->total(),
            ],
        ]);
    }

    /**
     * POST /api/v1/inventory/adjust
     * Registro manual de ajustes (entrada, salida, daño, ajuste de stock).
     */
    public function adjust(AdjustStockRequest $request): JsonResponse
    {
        $product = Product::findOrFail($request->product_id);

        $movement = $this->inventoryService->recordMovement(
            product:   $product,
            type:      $request->type,
            quantity:  (float) $request->quantity,
            user:      $request->user(),
            reason:    $request->reason,
            reference: $request->reference,
            notes:     $request->notes,
            unitCost:  $request->filled('unit_cost') ? (float) $request->unit_cost : null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Movimiento de inventario registrado correctamente.',
            'data'    => [
                'movement'  => $movement->load(['product:id,name,sku,unit', 'user:id,name']),
                'new_stock' => $product->fresh()->stock,
            ],
        ], 201);
    }
}
