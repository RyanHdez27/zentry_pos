<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /**
     * Registra un movimiento de inventario de forma atómica y segura.
     *
     * Tipos admitidos:
     * - entry      (Entrada / compra / recepción)
     * - exit       (Salida / merma / retiro)
     * - adjustment (Ajuste de inventario físico)
     * - sale       (Venta POS)
     * - return     (Devolución de cliente)
     * - damage     (Baja por avería o vencimiento)
     */
    public function recordMovement(
        Product $product,
        string $type,
        float $quantity,
        ?User $user = null,
        ?string $reason = null,
        ?string $reference = null,
        ?string $notes = null,
        ?float $unitCost = null
    ): InventoryMovement {
        return DB::transaction(function () use (
            $product,
            $type,
            $quantity,
            $user,
            $reason,
            $reference,
            $notes,
            $unitCost
        ) {
            // Bloqueo pesimista para evitar condiciones de carrera concurrentes
            /** @var Product $lockedProduct */
            $lockedProduct = Product::where('id', $product->id)
                ->where('company_id', $product->company_id)
                ->lockForUpdate()
                ->firstOrFail();

            $previousStock = (float) $lockedProduct->stock;
            $delta = 0.0;

            switch ($type) {
                case 'entry':
                case 'return':
                    $delta = abs($quantity);
                    break;

                case 'exit':
                case 'damage':
                case 'sale':
                    $delta = -abs($quantity);
                    break;

                case 'adjustment':
                    // Si es ajuste, la cantidad puede ser un delta relativo positivo o negativo
                    $delta = (float) $quantity;
                    break;

                default:
                    throw new \InvalidArgumentException("Tipo de movimiento de inventario no válido: [{$type}].");
            }

            $newStock = $previousStock + $delta;

            // Validación estricta: si controla inventario, no permitir stock negativo
            if ($lockedProduct->track_stock && $newStock < 0) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        "Stock insuficiente para '{$lockedProduct->name}'. Disponible: {$previousStock}, solicitado: " . abs($delta) . '.',
                    ],
                ]);
            }

            // Actualizar stock del producto
            $lockedProduct->update([
                'stock' => $newStock,
            ]);

            // Registrar movimiento en el kardex
            return InventoryMovement::create([
                'company_id'     => $lockedProduct->company_id,
                'product_id'     => $lockedProduct->id,
                'user_id'        => $user?->id,
                'type'           => $type,
                'quantity'       => $delta,
                'previous_stock' => $previousStock,
                'current_stock'  => $newStock,
                'unit_cost'      => $unitCost ?? $lockedProduct->cost,
                'reason'         => $reason,
                'reference'      => $reference,
                'notes'          => $notes,
            ]);
        });
    }

    /**
     * Obtiene el resumen de KPIs de inventario de una empresa.
     */
    public function getSummary(int $companyId): array
    {
        $products = Product::where('company_id', $companyId)->get();

        $totalProducts   = $products->count();
        $lowStockCount   = 0;
        $outOfStockCount = 0;
        $inventoryValue  = 0.0;

        foreach ($products as $p) {
            $stock = (float) $p->stock;
            $min   = (float) $p->stock_min;
            $cost  = (float) ($p->cost > 0 ? $p->cost : $p->price);

            if ($p->track_stock) {
                if ($stock <= 0) {
                    $outOfStockCount++;
                } elseif ($stock <= $min) {
                    $lowStockCount++;
                }
            }

            if ($stock > 0) {
                $inventoryValue += ($stock * $cost);
            }
        }

        return [
            'total_products'        => $totalProducts,
            'low_stock_count'       => $lowStockCount,
            'out_of_stock_count'    => $outOfStockCount,
            'total_inventory_value' => round($inventoryValue, 2),
        ];
    }
}
