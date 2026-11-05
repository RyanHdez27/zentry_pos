<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * GET /api/v1/customers
     * Listado paginado con filtros opcionales.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        // Filtro de búsqueda textual
        if ($request->filled('search')) {
            $term = '%'.$request->search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('document_number', 'like', $term)
                  ->orWhere('business_name', 'like', $term)
                  ->orWhere('phone', 'like', $term)
                  ->orWhere('email', 'like', $term);
            });
        }

        // Filtro por estado activo/inactivo
        if ($request->has('active')) {
            $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        $perPage   = min((int) ($request->per_page ?? 20), 100);
        $customers = $query
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $customers->items(),
            'meta'    => [
                'current_page' => $customers->currentPage(),
                'last_page'    => $customers->lastPage(),
                'per_page'     => $customers->perPage(),
                'total'        => $customers->total(),
            ],
        ]);
    }

    /**
     * POST /api/v1/customers
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = Customer::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Cliente registrado correctamente.',
            'data'    => $customer,
        ], 201);
    }

    /**
     * GET /api/v1/customers/{customer}
     */
    public function show(Customer $customer): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $customer,
        ]);
    }

    /**
     * PUT /api/v1/customers/{customer}
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $customer->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Cliente actualizado correctamente.',
            'data'    => $customer->fresh(),
        ]);
    }

    /**
     * DELETE /api/v1/customers/{customer}
     */
    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete(); // SoftDeletes

        return response()->json([
            'success' => true,
            'message' => 'Cliente eliminado correctamente.',
        ]);
    }

    /**
     * GET /api/v1/customers/search?q=term
     * Búsqueda rápida optimizada para terminal de ventas (POS).
     */
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string', 'min:1', 'max:100']]);

        $term      = '%'.$request->q.'%';
        $customers = Customer::where('is_active', true)
            ->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                  ->orWhere('document_number', 'like', $term)
                  ->orWhere('business_name', 'like', $term)
                  ->orWhere('phone', 'like', $term);
            })
            ->orderBy('name')
            ->limit(15)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $customers,
        ]);
    }
}
