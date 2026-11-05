<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sale\CancelSaleRequest;
use App\Http\Requests\Sale\CreateSaleRequest;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {}

    /**
     * GET /api/v1/sales
     * Listado paginado de facturas/ventas con filtros.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sale::with(['customer', 'user', 'payments'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('invoice_number', 'like', $term)
                  ->orWhereHas('customer', function ($cq) use ($term) {
                      $cq->where('name', 'like', $term)
                         ->orWhere('document_number', 'like', $term);
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = min((int) ($request->per_page ?? 20), 100);
        $sales = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $sales->items(),
            'meta'    => [
                'current_page' => $sales->currentPage(),
                'last_page'    => $sales->lastPage(),
                'per_page'     => $sales->perPage(),
                'total'        => $sales->total(),
            ],
        ]);
    }

    /**
     * GET /api/v1/sales/{sale}
     * Detalle completo de la factura con sus productos, cliente y pagos.
     */
    public function show(Sale $sale): JsonResponse
    {
        $sale->load([
            'customer',
            'user',
            'cashSession',
            'items.product.category',
            'payments',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $sale,
        ]);
    }

    /**
     * POST /api/v1/sales
     * Procesar una nueva venta atómica en POS.
     */
    public function store(CreateSaleRequest $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;

        $sale = $this->saleService->createSale(
            company: $company,
            user: $user,
            data: $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => "Venta {$sale->invoice_number} procesada exitosamente.",
            'data'    => $sale,
        ], 201);
    }

    /**
     * POST /api/v1/sales/{sale}/cancel
     * Anula una venta, restituyendo inventario y caja.
     */
    public function cancel(Sale $sale, CancelSaleRequest $request): JsonResponse
    {
        $user = $request->user();

        $cancelledSale = $this->saleService->cancelSale(
            sale: $sale,
            user: $user,
            reason: $request->reason
        );

        return response()->json([
            'success' => true,
            'message' => "Venta {$sale->invoice_number} anulada correctamente.",
            'data'    => $cancelledSale,
        ]);
    }
}
