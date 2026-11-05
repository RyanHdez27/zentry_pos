<?php

use App\Http\Controllers\Api\V1\AuditController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CashSessionController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\InventoryController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SaleController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ─── API v1 ───────────────────────────────────────────────────────────────────
Route::prefix('v1')->group(function () {

    // Health check público
    Route::get('/health', function () {
        $dbStatus = 'disconnected';
        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
        } catch (\Throwable $e) {
            $dbStatus = 'error: '.$e->getMessage();
        }

        return response()->json([
            'status'      => 'ok',
            'app'         => config('app.name'),
            'environment' => config('app.env'),
            'database'    => $dbStatus,
            'driver'      => config('database.default'),
            'timestamp'   => now()->toIso8601String(),
        ]);
    });

    // ── Autenticación (pública) ───────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me',      [AuthController::class, 'me']);
            Route::post('/profile', [AuthController::class, 'updateProfile']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    // ── Rutas protegidas (autenticación requerida) ────────────────────────────
    Route::middleware(['auth:sanctum', 'company.module'])->group(function () {

        // ── Categorías ────────────────────────────────────────────────────────
        // Lectura: cualquier rol autenticado
        Route::get('/categories',         [CategoryController::class, 'index']);
        Route::get('/categories/{category}', [CategoryController::class, 'show']);

        // Escritura: solo admin e inventory
        Route::middleware('role:admin,inventory')->group(function () {
            Route::post('/categories',              [CategoryController::class, 'store']);
            Route::put('/categories/{category}',    [CategoryController::class, 'update']);
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
        });

        // ── Productos ─────────────────────────────────────────────────────────
        // Búsqueda rápida para POS (cualquier rol)
        Route::get('/products/search', [ProductController::class, 'search']);

        // Lectura: cualquier rol autenticado
        Route::get('/products',           [ProductController::class, 'index']);
        Route::get('/products/{product}', [ProductController::class, 'show']);

        // Escritura: solo admin e inventory
        Route::middleware('role:admin,inventory')->group(function () {
            Route::post('/products',              [ProductController::class, 'store']);
            Route::put('/products/{product}',     [ProductController::class, 'update']);
            Route::delete('/products/{product}',  [ProductController::class, 'destroy']);
        });

        // ── Clientes ──────────────────────────────────────────────────────────
        // Búsqueda rápida para POS (cualquier rol)
        Route::get('/customers/search', [CustomerController::class, 'search']);

        // Lectura: cualquier rol autenticado
        Route::get('/customers',           [CustomerController::class, 'index']);
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);

        // Creación y edición: admin y cajeros
        Route::middleware('role:admin,cashier')->group(function () {
            Route::post('/customers',           [CustomerController::class, 'store']);
            Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        });

        // Borrado: solo administradores
        Route::middleware('role:admin')->group(function () {
            Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
        });

        // ── Inventario y Kardex ───────────────────────────────────────────────
        // Lectura: métricas y movimientos auditables
        Route::get('/inventory/summary',   [InventoryController::class, 'summary']);
        Route::get('/inventory/movements', [InventoryController::class, 'movements']);

        // Ajustes manuales: solo admin e inventory
        Route::middleware('role:admin,inventory')->group(function () {
            Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
        });

        // ── Caja y Turnos ─────────────────────────────────────────────────────
        // Consulta de turno activo y detalles
        Route::get('/cash-sessions/current',        [CashSessionController::class, 'current']);
        Route::get('/cash-sessions',                [CashSessionController::class, 'index']);
        Route::get('/cash-sessions/{cashSession}',  [CashSessionController::class, 'show']);

        // Operaciones de caja: cajeros y administradores
        Route::middleware('role:admin,cashier')->group(function () {
            Route::post('/cash-sessions/open',                         [CashSessionController::class, 'open']);
            Route::post('/cash-sessions/{cashSession}/movements',       [CashSessionController::class, 'storeMovement']);
            Route::post('/cash-sessions/{cashSession}/close',           [CashSessionController::class, 'close']);
        });

        // ── Ventas y Facturas ─────────────────────────────────────────────────
        // Listado y consulta de detalle
        Route::get('/sales',        [SaleController::class, 'index']);
        Route::get('/sales/{sale}', [SaleController::class, 'show']);

        // Crear venta: cajeros y administradores
        Route::middleware('role:admin,cashier')->group(function () {
            Route::post('/sales', [SaleController::class, 'store']);
        });

        // Anular venta: exclusivamente administradores
        Route::middleware('role:admin')->group(function () {
            Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel']);
        });

        // ── Métricas y Reportes ───────────────────────────────────────────────
        Route::get('/dashboard/stats',  [DashboardController::class, 'stats']);
        Route::get('/reports/summary',   [DashboardController::class, 'reports']);

        // ── Bitácora y Auditoría ──────────────────────────────────────────────
        Route::get('/audit/logs',        [AuditController::class, 'logs']);

        // ── Configuración de Empresa ──────────────────────────────────────────
        Route::middleware('role:superadmin')->group(function () {
            Route::get('/companies', [CompanyController::class, 'index']);
            Route::get('/superadmin/dashboard', [CompanyController::class, 'dashboard']);
            Route::post('/companies', [CompanyController::class, 'store']);
            Route::put('/companies/{company}', [CompanyController::class, 'superadminUpdate']);
            Route::delete('/companies/{company}', [CompanyController::class, 'destroy']);
            Route::get('/companies/{company}/users', [CompanyController::class, 'users']);
            Route::get('/companies/{company}/audit', [CompanyController::class, 'audit']);
            Route::post('/companies/{company}/users', [CompanyController::class, 'createUser']);
            Route::put('/companies/{company}/users/{user}', [CompanyController::class, 'updateUser']);
            Route::delete('/companies/{company}/users/{user}', [CompanyController::class, 'deleteUser']);
        });
        Route::get('/company',           [CompanyController::class, 'show']);
        Route::middleware('role:admin')->group(function () {
            Route::put('/company',       [CompanyController::class, 'update']);
        });

        // ── Gestión de Usuarios y Personal ────────────────────────────────────
        Route::middleware('role:admin,cashier')->group(function () {
            Route::get('/users',         [UserController::class, 'index']);
            Route::post('/users',        [UserController::class, 'store']);
            Route::put('/users/{user}',  [UserController::class, 'update']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
        });
    });
});
