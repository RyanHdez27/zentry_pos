<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Tipo de movimiento: entrada, salida, ajuste, venta, devolucion, dano
            $table->string('type', 30)->comment('entry, exit, adjustment, sale, return, damage');

            // Cantidades con 3 decimales para permitir unidades o fraccionados (kg, litros)
            $table->decimal('quantity', 12, 3)->comment('Delta positivo o negativo');
            $table->decimal('previous_stock', 12, 3)->comment('Existencia previa');
            $table->decimal('current_stock', 12, 3)->comment('Existencia resultante');

            // Costo y trazabilidad
            $table->decimal('unit_cost', 14, 2)->nullable()->comment('Costo unitario en este movimiento');
            $table->string('reason', 150)->nullable()->comment('Motivo o concepto');
            $table->string('reference', 100)->nullable()->comment('Folio, factura, orden o id de venta');
            $table->text('notes')->nullable();

            $table->timestamps();

            // Índices para reportes y kardex
            $table->index(['company_id', 'product_id', 'created_at']);
            $table->index(['company_id', 'type']);
            $table->index(['company_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
