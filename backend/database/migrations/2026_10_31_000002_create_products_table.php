<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            // Identificación
            $table->string('name', 200);
            $table->string('sku', 80)->nullable()->comment('Código interno');
            $table->string('barcode', 100)->nullable()->comment('Código de barras EAN/UPC');
            $table->text('description')->nullable();

            // Precios e impuestos
            $table->decimal('price', 14, 2)->comment('Precio de venta sin impuesto');
            $table->decimal('cost', 14, 2)->default(0)->comment('Costo de compra');
            $table->decimal('tax_rate', 5, 2)->default(0)->comment('% IVA aplicable');

            // Inventario
            $table->decimal('stock', 12, 3)->default(0)->comment('Unidades disponibles');
            $table->decimal('stock_min', 12, 3)->default(0)->comment('Alerta de stock bajo');
            $table->string('unit', 40)->default('unidad')->comment('Ej: unidad, kg, litro');

            // Control
            $table->boolean('is_active')->default(true);
            $table->boolean('track_stock')->default(true)->comment('¿Controla inventario?');
            $table->string('image_url', 500)->nullable();

            $table->timestamps();
            $table->softDeletes();

            // SKU y barcode únicos por empresa
            $table->unique(['company_id', 'sku']);
            $table->unique(['company_id', 'barcode']);
            $table->index(['company_id', 'is_active']);
            $table->index(['company_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
