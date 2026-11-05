import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { salesChart as demoSalesChart, fmt } from '../data/demo';
import { dashboardApi, cashApi, DashboardStats, CashSession, CashSummary } from '../services/api';

const periods = ['Hoy', 'Esta semana', 'Este mes'];
const dateInput = (d: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  setPage: (p: string) => void;
}

export default function Dashboard({ setPage }: DashboardProps) {
  const [period, setPeriod] = useState('Hoy');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [cashSummary, setCashSummary] = useState<CashSummary | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, cashRes] = await Promise.allSettled([
        dashboardApi.getStats({ date_from: dateFrom || undefined, date_to: dateTo || undefined }),
        cashApi.getCurrent(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
      if (cashRes.status === 'fulfilled' && cashRes.value.data?.session) {
        setCashSession(cashRes.value.data.session);
        setCashSummary(cashRes.value.data.summary);
      }
    } catch (e: any) {
      console.warn('Dashboard usando modo demo:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFrom, dateTo]);

  const hasDateFilter = Boolean(dateFrom || dateTo);
  const todaySales = hasDateFilter ? (stats?.filter_summary?.revenue ?? 0) : (stats?.kpis.today_sales ?? 0);
  const monthSales = hasDateFilter ? (stats?.filter_summary?.sales ?? 0) : (stats?.kpis.month_sales ?? 0);
  const itemsSold = stats?.kpis.month_items_sold ?? 0;
  const customersCount = stats?.kpis.total_customers ?? 0;

  const kpis = [
    {
      label: hasDateFilter ? 'Ventas del rango' : 'Ventas de hoy',
      value: fmt(todaySales),
      change: '',
      up: true,
      icon: DollarSign,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: hasDateFilter ? 'Operaciones del rango' : 'Ventas del mes',
      value: hasDateFilter ? String(monthSales) : fmt(monthSales),
      change: '',
      up: true,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Productos vendidos (mes)',
      value: String(itemsSold),
      change: '',
      up: true,
      icon: Package,
      color: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Clientes registrados',
      value: String(customersCount),
      change: '',
      up: true,
      icon: Users,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  const chartData = stats?.sales_chart?.length
    ? stats.sales_chart.map((d) => ({ day: d.day, ventas: d.total }))
    : demoSalesChart;

  const chartTotal = chartData.reduce((acc, cur) => acc + (cur.ventas || 0), 0);

  const topProducts = stats?.top_products ?? [];

  const lowStockAlerts = stats?.low_stock_alerts || [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Resumen general</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('es-CO', {
              timeZone: 'America/Bogota',
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-500">Desde <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPeriod('Personalizado'); }} className="ml-1 rounded border border-slate-200 px-2 py-1.5" /></label>
          <label className="text-xs text-slate-500">Hasta <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPeriod('Personalizado'); }} className="ml-1 rounded border border-slate-200 px-2 py-1.5" /></label>
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-blue-600">Limpiar fechas</button>}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => { setPeriod(p); const end = new Date(); const start = new Date(end); if (p === 'Esta semana') start.setDate(end.getDate() - 6); if (p === 'Este mes') start.setDate(1); setDateFrom(dateInput(start)); setDateTo(dateInput(end)); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <Icon size={20} />
                </div>
                {kpi.change && <span
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                    kpi.up ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                  }`}
                >
                  {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {kpi.change}
                </span>}
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{kpi.value}</p>
              <p className="text-sm text-slate-500">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Chart + Side panels */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Ventas últimos 7 días</h2>
              <p className="text-sm text-slate-500">Total en periodo: {fmt(chartTotal)}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="ventas"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#salesGrad)"
                dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Caja summary card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Caja principal</h2>
            {cashSession?.status === 'open' ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Abierta
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Cerrada
              </span>
            )}
          </div>

          <div className="space-y-3 flex-1">
            {[
              {
                label: 'Monto inicial',
                value: fmt(cashSummary?.initial ?? 0),
                muted: true,
              },
              {
                label: 'Ventas en efectivo',
                value: fmt(cashSummary?.sales ?? 0),
                positive: true,
              },
              {
                label: 'Retiros / Gastos',
                value: `-${fmt(cashSummary?.withdrawals ?? 100000)}`,
                negative: true,
              },
              {
                label: 'Efectivo esperado',
                value: fmt(cashSummary?.expected ?? 1950000),
                bold: true,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <span className="text-sm text-slate-500">{row.label}</span>
                <span
                  className={`text-sm font-semibold ${
                    row.bold
                      ? 'text-slate-900 font-bold'
                      : row.positive
                      ? 'text-emerald-600'
                      : row.negative
                      ? 'text-red-500'
                      : 'text-slate-700'
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPage('cash')}
            className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Ir a control de caja <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Productos más vendidos</h2>
            <button
              onClick={() => setPage('products')}
              className="text-xs text-blue-600 font-semibold hover:text-blue-700"
            >
              Ver catálogo
            </button>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 text-sm font-bold text-slate-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.qty} unidades vendidas</p>
                </div>
                <span className="text-sm font-bold text-slate-900">{fmt(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h2 className="text-base font-semibold text-slate-900">Alertas de inventario</h2>
              </div>
              <button
                onClick={() => setPage('inventory')}
                className="text-xs text-blue-600 font-semibold hover:text-blue-700"
              >
                Ver inventario
              </button>
            </div>

            {lowStockAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200/60"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500 font-mono">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {item.stock} disponibles
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Mín: {item.stock_min}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                <Package size={28} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-medium text-slate-800">Inventario en niveles óptimos</p>
                <p className="text-xs text-slate-400 mt-0.5">No hay productos por debajo del stock mínimo.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setPage('pos')}
            className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            Abrir nueva venta en POS <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
