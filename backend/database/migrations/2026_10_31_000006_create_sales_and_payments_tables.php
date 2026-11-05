<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Ventas / Comprobantes ─────────────────────────────────────────────
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Vendedor / Cajero
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('cash_session_id')->nullable()->constrained('cash_sessions')->nullOnDelete();
            $table->string('invoice_number', 50);
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->string('status', 20)->default('completed'); // completed, cancelled
            $table->string('payment_status', 20)->default('paid'); // paid, partial, pending
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['company_id', 'invoice_number']);
            $table->index(['company_id', 'created_at']);
            $table->index(['company_id', 'status']);
        });

        // ── Detalle de Ítems Vendidos ──────────────────────────────────────────
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('product_name');
            $table->string('product_sku')->nullable();
            $table->decimal('quantity', 10, 3)->default(1.000);
            $table->decimal('unit_price', 12, 2)->default(0.00);
            $table->decimal('unit_cost', 12, 2)->default(0.00); // Costo histórico al momento de la venta
            $table->decimal('tax_rate', 5, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);
            $table->timestamps();

            $table->index(['company_id', 'product_id']);
        });

        // ── Pagos Recibidos ────────────────────────────────────────────────────
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('cash_session_id')->nullable()->constrained('cash_sessions')->nullOnDelete();
            $table->string('payment_method', 30)->default('cash'); // cash, card, transfer, credit, other
            $table->decimal('amount', 12, 2)->default(0.00);
            $table->decimal('tendered', 12, 2)->nullable(); // Monto entregado (para cálculo de cambio en efectivo)
            $table->decimal('change', 12, 2)->default(0.00); // Cambio devuelto
            $table->string('reference')->nullable(); // Número de transacción o voucher
            $table->string('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'payment_method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
