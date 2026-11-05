<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/v1/dashboard/stats
     * Retorna los KPIs y métricas en tiempo real para el Dashboard principal.
     */
    public function stats(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;
        $dateFrom = $request->date('date_from');
        $dateTo = $request->date('date_to');
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        // 1. Ventas de hoy
        $todaySalesQuery = Sale::where('company_id', $companyId)
            ->where('status', 'completed')
            ->whereDate('created_at', $today);

        $todayTotal = (float) $todaySalesQuery->sum('total');
        $todayCount = (int) $todaySalesQuery->count();
        $todayCustomers = (int) $todaySalesQuery->distinct('customer_id')->whereNotNull('customer_id')->count('customer_id');
        $avgTicketToday = $todayCount > 0 ? round($todayTotal / $todayCount, 2) : 0;

        // 2. Ventas del mes
        $monthSalesQuery = Sale::where('company_id', $companyId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $startOfMonth);

        $monthTotal = (float) $monthSalesQuery->sum('total');
        $monthCount = (int) $monthSalesQuery->count();

        // 3. Total productos vendidos en el mes
        $monthItemsSold = (int) SaleItem::where('company_id', $companyId)
            ->whereHas('sale', fn ($q) => $q->where('status', 'completed')->where('created_at', '>=', $startOfMonth))
            ->sum('quantity');

        // 4. Clientes totales registrados
        $totalCustomers = (int) Customer::where('company_id', $companyId)->count();

        // 5. Gráfica de los últimos 7 días
        $recentDays = [];
        if ($dateFrom || $dateTo) {
            $filteredQuery = Sale::where('company_id', $companyId)->where('status', 'completed');
            if ($dateFrom) $filteredQuery->whereDate('created_at', '>=', $dateFrom);
            if ($dateTo) $filteredQuery->whereDate('created_at', '<=', $dateTo);
            $chartRows = (clone $filteredQuery)->selectRaw('DATE(created_at) as sale_date, SUM(total) as total')->groupByRaw('DATE(created_at)')->orderBy('sale_date')->get();
            foreach ($chartRows as $row) $recentDays[] = ['day' => Carbon::parse($row->sale_date)->locale('es')->isoFormat('D MMM'), 'date' => (string) $row->sale_date, 'total' => (float) $row->total];
            $filterSummary = ['sales' => (clone $filteredQuery)->count(), 'revenue' => (float) (clone $filteredQuery)->sum('total')];
        } else {
            $filterSummary = null;
        }
        if (! ($dateFrom || $dateTo)) for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayName = $date->locale('es')->isoFormat('ddd'); // Lun, Mar, Mié...
            $dayTotal = (float) Sale::where('company_id', $companyId)
                ->where('status', 'completed')
                ->whereDate('created_at', $date)
                ->sum('total');

            $recentDays[] = [
                'day'   => ucfirst($dayName),
                'date'  => $date->format('Y-m-d'),
                'total' => $dayTotal,
            ];
        }

        // 6. Top 5 productos más vendidos (por volumen y dinero)
        $topProducts = SaleItem::where('company_id', $companyId)
            ->whereHas('sale', function ($q) use ($dateFrom, $dateTo) { $q->where('status', 'completed'); if ($dateFrom) $q->whereDate('created_at', '>=', $dateFrom); if ($dateTo) $q->whereDate('created_at', '<=', $dateTo); })
            ->select(
                'product_name',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(total) as total_revenue')
            )
            ->groupBy('product_name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'name'    => $item->product_name,
                'qty'     => (float) $item->total_qty,
                'revenue' => (float) $item->total_revenue,
            ]);

        // 7. Alertas de inventario (bajo stock o agotados)
        $lowStockProducts = Product::where('company_id', $companyId)
            ->where('track_stock', true)
            ->whereColumn('stock', '<=', 'stock_min')
            ->orderBy('stock')
            ->limit(5)
            ->get(['id', 'name', 'sku', 'stock', 'stock_min']);

        // 8. Desglose de métodos de pago
        $paymentsDistribution = Payment::where('company_id', $companyId)
            ->whereHas('sale', fn ($q) => $q->where('status', 'completed'))
            ->select('payment_method', DB::raw('SUM(amount) as total_amount'))
            ->groupBy('payment_method')
            ->get()
            ->map(fn ($p) => [
                'method' => $p->payment_method,
                'amount' => (float) $p->total_amount,
            ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'kpis' => [
                    'today_sales'          => $todayTotal,
                    'today_count'          => $todayCount,
                    'today_customers'      => $todayCustomers,
                    'avg_ticket_today'     => $avgTicketToday,
                    'month_sales'          => $monthTotal,
                    'month_count'          => $monthCount,
                    'month_items_sold'     => $monthItemsSold,
                    'total_customers'      => $totalCustomers,
                ],
                'sales_chart'           => $recentDays,
                'top_products'          => $topProducts,
                'low_stock_alerts'      => $lowStockProducts,
                'payments_distribution' => $paymentsDistribution,
                'filter_summary' => $filterSummary,
            ],
        ]);
    }

    /**
     * GET /api/v1/reports/summary
     * Reporte detallado de rendimiento comercial y margen de ganancia.
     */
    public function reports(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $query = Sale::where('company_id', $companyId)->where('status', 'completed');

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $sales = $query->with(['items', 'user', 'customer', 'payments'])->get();

        $totalRevenue = (float) $sales->sum('total');
        $totalSalesCount = $sales->count();
        $avgTicket = $totalSalesCount > 0 ? round($totalRevenue / $totalSalesCount, 2) : 0;
        $uniqueCustomers = $sales->pluck('customer_id')->filter()->unique()->count();

        // Calcular costo y margen bruto
        $totalCost = 0.0;
        foreach ($sales as $sale) {
            foreach ($sale->items as $item) {
                $totalCost += ((float) $item->unit_cost * (float) $item->quantity);
            }
        }
        $grossMargin = $totalRevenue - $totalCost;
        $grossMarginPercentage = $totalRevenue > 0 ? round(($grossMargin / $totalRevenue) * 100, 2) : 0;

        // Ventas por cajero
        $salesByCashier = $sales->groupBy('user_id')->map(function ($group) {
            $user = $group->first()->user;
            return [
                'user_id' => $user?->id,
                'name'    => $user?->name ?? 'Desconocido',
                'sales'   => $group->count(),
                'total'   => (float) $group->sum('total'),
            ];
        })->values();

        $salesByDay = $sales->groupBy(fn ($sale) => Carbon::parse($sale->created_at)->format('Y-m-d'))
            ->sortKeys()
            ->map(fn ($group, $date) => [
                'date' => $date,
                'day' => ucfirst(Carbon::parse($date)->locale('es')->isoFormat('ddd D MMM')),
                'total' => (float) $group->sum('total'),
                'sales' => $group->count(),
            ])->values();

        $paymentsByMethod = $sales->flatMap(fn ($sale) => $sale->payments)
            ->groupBy('payment_method')
            ->map(fn ($group, $method) => ['method' => $method, 'amount' => (float) $group->sum('amount')])
            ->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'summary' => [
                    'total_revenue'           => $totalRevenue,
                    'total_sales'             => $totalSalesCount,
                    'avg_ticket'              => $avgTicket,
                    'unique_customers'        => $uniqueCustomers,
                    'total_cost'              => $totalCost,
                    'gross_margin'            => $grossMargin,
                    'gross_margin_percentage' => $grossMarginPercentage,
                ],
                'by_cashier' => $salesByCashier,
                'sales_chart' => $salesByDay,
                'payments_distribution' => $paymentsByMethod,
            ],
        ]);
    }
}
