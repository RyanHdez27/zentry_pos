<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}
    /**
     * GET /api/v1/products
     * Listado paginado con filtros opcionales.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category:id,name,color,icon');

        // Filtros
        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('sku', 'like', $term)
                  ->orWhere('barcode', 'like', $term);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('active')) {
            $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('low_stock')) {
            // Productos con stock ≤ stock_min y que controlan inventario
            $query->where('track_stock', true)
                  ->whereColumn('stock', '<=', 'stock_min');
        }

        $perPage  = min((int) ($request->per_page ?? 20), 100);
        $products = $query
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $products->items(),
            'meta'    => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total(),
            ],
        ]);
    }

    /**
     * POST /api/v1/products
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $initialStock = (float) ($data['stock'] ?? 0);
        unset($data['image']);
        if ($request->hasFile('image')) $data['image_url'] = Storage::disk('public')->url($request->file('image')->store('products', 'public'));
        $data['stock'] = 0;
        $product = DB::transaction(function () use ($data, $initialStock, $request) {
            $product = Product::create($data);
            if ($initialStock > 0) $this->inventoryService->recordMovement($product, 'entry', $initialStock, $request->user(), 'Stock inicial al crear producto');
            return $product->fresh();
        });

        return response()->json([
            'success' => true,
            'message' => 'Producto creado correctamente.',
            'data'    => $product->load('category:id,name,color,icon'),
        ], 201);
    }

    /**
     * GET /api/v1/products/{product}
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $product->load('category:id,name,color,icon'),
        ]);
    }

    /**
     * PUT /api/v1/products/{product}
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();
        $stock = array_key_exists('stock', $data) ? (float) $data['stock'] : (float) $product->stock;
        unset($data['stock'], $data['image']);
        if ($request->hasFile('image')) $data['image_url'] = Storage::disk('public')->url($request->file('image')->store('products', 'public'));
        DB::transaction(function () use ($product, $data, $stock, $request) {
            $product->update($data);
            $delta = $stock - (float) $product->fresh()->stock;
            if ($delta !== 0.0) $this->inventoryService->recordMovement($product->fresh(), $delta > 0 ? 'entry' : 'adjustment', $delta, $request->user(), 'Ajuste de stock desde ficha de producto');
        });

        return response()->json([
            'success' => true,
            'message' => 'Producto actualizado correctamente.',
            'data'    => $product->fresh()->load('category:id,name,color,icon'),
        ]);
    }

    /**
     * DELETE /api/v1/products/{product}
     * Soft-delete: el producto no desaparece del historial de ventas.
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete(); // SoftDeletes

        return response()->json([
            'success' => true,
            'message' => 'Producto eliminado correctamente.',
        ]);
    }

    /**
     * GET /api/v1/products/search?q=term
     * Búsqueda rápida para el POS (sin paginación, máx. 15 resultados).
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string', 'min:1', 'max:100']]);

        $term     = '%'.$request->q.'%';
        $products = Product::with('category:id,name,color')
            ->where('is_active', true)
            ->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('sku', 'like', $term)
                  ->orWhere('barcode', 'like', $term);
            })
            ->orderBy('name')
            ->limit(15)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $products,
        ]);
    }
}
