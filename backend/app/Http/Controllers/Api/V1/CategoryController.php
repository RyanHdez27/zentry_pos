<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * GET /api/v1/categories
     * Lista todas las categorías de la empresa autenticada.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query();

        // Filtro opcional por estado
        if ($request->has('active')) {
            $query->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        $categories = $query
            ->withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $categories,
        ]);
    }

    /**
     * POST /api/v1/categories
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Categoría creada correctamente.',
            'data'    => $category,
        ], 201);
    }

    /**
     * GET /api/v1/categories/{category}
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $category->loadCount('products'),
        ]);
    }

    /**
     * PUT /api/v1/categories/{category}
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Categoría actualizada correctamente.',
            'data'    => $category->fresh()->loadCount('products'),
        ]);
    }

    /**
     * DELETE /api/v1/categories/{category}
     * Desactiva la categoría y desvincula sus productos (category_id → null).
     */
    public function destroy(Category $category): JsonResponse
    {
        // Desvincular productos antes de eliminar
        $category->products()->update(['category_id' => null]);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoría eliminada. Los productos vinculados quedaron sin categoría.',
        ]);
    }
}
