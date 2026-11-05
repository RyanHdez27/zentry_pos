<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected CashService $cashService
    ) {}

    /**
     * Procesa una venta en una transacción ACID atómica garantizando:
     * 1. Consecutivo de factura único y ordenado por tenant.
     * 2. Descuento atómico de existencias y registro en Kardex.
     * 3. Asociación y registro en la sesión de caja activa (si hubo efectivo).
     * 4. Validación de cupo de crédito (si fue a crédito).
     */
    public function createSale(Company $company, User $user, array $data): Sale
    {
        return DB::transaction(function () use ($company, $user, $data) {
            // 1. Obtener y bloquear la empresa para consecutivo atómico
            /** @var Company $lockedCompany */
            $lockedCompany = Company::where('id', $company->id)->lockForUpdate()->firstOrFail();
            $prefix = $lockedCompany->invoice_prefix ?? 'FV-';
            $nextNum = $lockedCompany->next_invoice_number ?? 1;
            $invoiceNumber = $prefix . str_pad((string) $nextNum, 6, '0', STR_PAD_LEFT);
            $lockedCompany->increment('next_invoice_number');

            // 2. Verificar cliente si fue provisto
            $customerId = $data['customer_id'] ?? null;
            $customer = null;
            if ($customerId) {
                $customer = Customer::where('company_id', $company->id)->find($customerId);
            }

            // 3. Verificar pagos y sesión de caja
            $paymentsData = $data['payments'] ?? [];
            if (empty($paymentsData)) {
                // Si no se especificó pago, por defecto efectivo por el total
                $paymentsData = [['payment_method' => 'cash', 'amount' => 0]];
            }

            $hasCashPayment = collect($paymentsData)->contains(fn ($p) => ($p['payment_method'] ?? '') === 'cash');
            $activeCashSession = null;

            if ($hasCashPayment) {
                $activeCashSession = $this->cashService->getCurrentSession($company, $user);
                if (! $activeCashSession) {
                    throw ValidationException::withMessages([
                        'cash_session' => ['No hay una sesión de caja abierta para registrar ventas en efectivo. Por favor abre caja primero.'],
                    ]);
                }
            }

            // 4. Procesar ítems y descontar stock
            $itemsData = $data['items'] ?? [];
            if (empty($itemsData)) {
                throw ValidationException::withMessages([
                    'items' => ['La venta debe contener al menos un producto.'],
                ]);
            }

            $computedSubtotal = 0.0;
            $computedTaxTotal = 0.0;
            $processedItems = [];

            foreach ($itemsData as $item) {
                $productId = $item['product_id'];
                $quantity = (float) ($item['quantity'] ?? 1);

                if ($quantity <= 0) {
                    throw ValidationException::withMessages([
                        'items' => ['La cantidad de cada producto debe ser mayor a 0.'],
                    ]);
                }

                /** @var Product $product */
                $product = Product::where('company_id', $company->id)
                    ->lockForUpdate()
                    ->findOrFail($productId);

                // Descontar inventario de forma atómica a través de InventoryService
                if ($product->track_stock) {
                    $this->inventoryService->recordMovement(
                        product: $product,
                        type: 'sale',
                        quantity: $quantity,
                        user: $user,
                        reason: "Venta {$invoiceNumber}",
                        reference: $invoiceNumber,
                        notes: 'Venta generada en terminal POS',
                        unitCost: (float) $product->cost
                    );
                }

                $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : (float) $product->price;
                $itemDiscount = (float) ($item['discount_amount'] ?? 0);
                $taxRate = (float) $product->tax_rate;

                $itemSubtotal = ($unitPrice * $quantity) - $itemDiscount;
                $itemTax = round($itemSubtotal * ($taxRate / 100), 2);
                $itemTotal = $itemSubtotal + $itemTax;

                $computedSubtotal += $itemSubtotal;
                $computedTaxTotal += $itemTax;

                $processedItems[] = [
                    'product'         => $product,
                    'quantity'        => $quantity,
                    'unit_price'      => $unitPrice,
                    'unit_cost'       => (float) $product->cost,
                    'tax_rate'        => $taxRate,
                    'tax_amount'      => $itemTax,
                    'discount_amount' => $itemDiscount,
                    'subtotal'        => $itemSubtotal,
                    'total'           => $itemTotal,
                ];
            }

            $globalDiscount = (float) ($data['discount_amount'] ?? 0);
            $totalSale = max(0, ($computedSubtotal - $globalDiscount) + $computedTaxTotal);

            // 5. Validar y procesar pagos
            $totalPaid = 0.0;
            $preparedPayments = [];

            foreach ($paymentsData as $p) {
                $method = $p['payment_method'] ?? 'cash';
                $amount = isset($p['amount']) && (float) $p['amount'] > 0 ? (float) $p['amount'] : $totalSale;
                $tendered = isset($p['tendered']) ? (float) $p['tendered'] : $amount;
                $change = $method === 'cash' ? max(0, $tendered - $amount) : 0.0;

                // Validación de crédito
                if ($method === 'credit') {
                    if (! $customer) {
                        throw ValidationException::withMessages([
                            'customer_id' => ['Se requiere asociar un cliente registrado para compras a crédito.'],
                        ]);
                    }

                    $newBalance = (float) $customer->current_balance + $amount;
                    if ($newBalance > (float) $customer->credit_limit) {
                        throw ValidationException::withMessages([
                            'credit' => ["El cliente supera su límite de crédito autorizado ({$customer->credit_limit}). Balance actual: {$customer->current_balance}."],
                        ]);
                    }

                    $customer->increment('current_balance', $amount);
                }

                $totalPaid += $amount;

                $preparedPayments[] = [
                    'payment_method'  => $method,
                    'amount'          => $amount,
                    'tendered'        => $tendered,
                    'change'          => $change,
                    'reference'       => $p['reference'] ?? null,
                    'cash_session_id' => ($method === 'cash' && $activeCashSession) ? $activeCashSession->id : null,
                ];
            }

            // 6. Crear cabecera de la venta
            $sale = Sale::create([
                'company_id'      => $company->id,
                'user_id'         => $user->id,
                'customer_id'     => $customer?->id,
                'cash_session_id' => $activeCashSession?->id,
                'invoice_number'  => $invoiceNumber,
                'subtotal'        => $computedSubtotal,
                'tax_amount'      => $computedTaxTotal,
                'discount_amount' => $globalDiscount,
                'total'           => $totalSale,
                'status'          => 'completed',
                'payment_status'  => $totalPaid >= $totalSale ? 'paid' : 'partial',
                'notes'           => $data['notes'] ?? null,
            ]);

            // 7. Crear ítems de venta
            foreach ($processedItems as $pi) {
                SaleItem::create([
                    'company_id'      => $company->id,
                    'sale_id'         => $sale->id,
                    'product_id'      => $pi['product']->id,
                    'product_name'    => $pi['product']->name,
                    'product_sku'     => $pi['product']->sku,
                    'quantity'        => $pi['quantity'],
                    'unit_price'      => $pi['unit_price'],
                    'unit_cost'       => $pi['unit_cost'],
                    'tax_rate'        => $pi['tax_rate'],
                    'tax_amount'      => $pi['tax_amount'],
                    'discount_amount' => $pi['discount_amount'],
                    'subtotal'        => $pi['subtotal'],
                    'total'           => $pi['total'],
                ]);
            }

            // 8. Crear registros de pago y reflejar en caja
            foreach ($preparedPayments as $pp) {
                Payment::create([
                    'company_id'      => $company->id,
                    'sale_id'         => $sale->id,
                    'cash_session_id' => $pp['cash_session_id'],
                    'payment_method'  => $pp['payment_method'],
                    'amount'          => $pp['amount'],
                    'tendered'        => $pp['tendered'],
                    'change'          => $pp['change'],
                    'reference'       => $pp['reference'],
                ]);

                // Registrar en movimientos de caja si fue en efectivo
                if ($pp['payment_method'] === 'cash' && $activeCashSession) {
                    $this->cashService->recordMovement(
                        session: $activeCashSession,
                        user: $user,
                        type: 'sale',
                        amount: $pp['amount'],
                        description: "Venta {$invoiceNumber}",
                        reference: $invoiceNumber
                    );
                }
            }

            return $sale->load(['items.product', 'payments', 'customer', 'user']);
        });
    }

    /**
     * Anula una venta previamente completada:
     * - Revierte inventario a través del Kardex (`type: return`).
     * - Si hubo pago a crédito, restaura el cupo de crédito del cliente.
     * - Si hubo pago en efectivo y hay caja abierta, genera un egreso/anulación en caja.
     * - Marca la venta como 'cancelled'.
     */
    public function cancelSale(Sale $sale, User $user, ?string $reason = null): Sale
    {
        if ($sale->isCancelled()) {
            throw ValidationException::withMessages([
                'sale' => ['Esta venta ya ha sido anulada previamente.'],
            ]);
        }

        return DB::transaction(function () use ($sale, $user, $reason) {
            // 1. Revertir inventario
            foreach ($sale->items as $item) {
                /** @var Product $product */
                $product = Product::where('company_id', $sale->company_id)->find($item->product_id);
                if ($product && $product->track_stock) {
                    $this->inventoryService->recordMovement(
                        product: $product,
                        type: 'return',
                        quantity: (float) $item->quantity,
                        user: $user,
                        reason: "Anulación venta {$sale->invoice_number}: " . ($reason ?? 'Sin motivo especificado'),
                        reference: $sale->invoice_number,
                        notes: 'Retorno automático por anulación de factura',
                        unitCost: (float) $item->unit_cost
                    );
                }
            }

            // 2. Revertir crédito si aplica
            if ($sale->customer_id) {
                $creditPaid = $sale->payments()->where('payment_method', 'credit')->sum('amount');
                if ($creditPaid > 0 && $sale->customer) {
                    $sale->customer->decrement('current_balance', $creditPaid);
                }
            }

            // 3. Revertir efectivo en caja activa si aplica
            $cashPaid = $sale->payments()->where('payment_method', 'cash')->sum('amount');
            if ($cashPaid > 0) {
                $company = $sale->company ?? Company::findOrFail($sale->company_id);
                $activeCashSession = $this->cashService->getCurrentSession($company, $user);
                if ($activeCashSession) {
                    $this->cashService->recordMovement(
                        session: $activeCashSession,
                        user: $user,
                        type: 'cancellation',
                        amount: (float) $cashPaid,
                        description: "Anulación venta {$sale->invoice_number}",
                        reference: $sale->invoice_number
                    );
                }
            }

            $sale->update([
                'status' => 'cancelled',
                'notes'  => trim(($sale->notes ?? '') . " | Anulada: {$reason}"),
            ]);

            return $sale->fresh(['items', 'payments', 'customer', 'user']);
        });
    }
}
