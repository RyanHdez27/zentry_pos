import { useState } from 'react';
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign, AlertTriangle, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { salesChart, fmt } from '../data/demo';

const periods = ['Hoy', 'Esta semana', 'Este mes', 'Personalizado'];

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

  const kpis = [
    { label: 'Ventas de hoy', value: '$2.450.000', change: '+12,5%', up: true, icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
    { label: 'Ventas del mes', value: '$45.800.000', change: '+8,2%', up: true, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Productos vendidos', value: '824', change: '+5,4%', up: true, icon: Package, color: 'bg-violet-50 text-violet-600' },
    { label: 'Clientes', value: '1.245', change: '+3,1%', up: true, icon: Users, color: 'bg-amber-50 text-amber-600' },
  ];

  const topProducts = [
    { name: 'Mouse Logitech M185', qty: 128, revenue: 10240000 },
    { name: 'Teclado Logitech K120', qty: 95, revenue: 5700000 },
    { name: 'Audífonos JBL', qty: 82, revenue: 4920000 },
    { name: 'Monitor Samsung 24"', qty: 34, revenue: 28900000 },
    { name: 'Memoria USB 64GB', qty: 71, revenue: 3195000 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Resumen general</h1>
          <p className="text-sm text-slate-500 mt-0.5">Lunes, 26 de septiembre de 2026</p>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                period === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <Icon size={20} />
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  kpi.up ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                }`}>
                  {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {kpi.change}
                </span>
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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Ventas últimos 7 días</h2>
              <p className="text-sm text-slate-500">Total: $17.100.000</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesChart} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ventas" stroke="#2563EB" strokeWidth={2.5}
                fill="url(#salesGrad)" dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Caja summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Caja principal</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Abierta
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: 'Monto inicial', value: '$200.000', muted: true },
              { label: 'Ventas', value: '$1.850.000', positive: true },
              { label: 'Retiros', value: '-$100.000', negative: true },
              { label: 'Efectivo esperado', value: '$1.950.000', bold: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{row.label}</span>
                <span className={`text-sm font-semibold ${
                  row.bold ? 'text-slate-900' : row.positive ? 'text-emerald-600' : row.negative ? 'text-red-500' : 'text-slate-700'
                }`}>{row.value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setPage('cash')} className="mt-4 w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            Ver caja completa
          </button>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Productos más vendidos</h2>
            <button onClick={() => setPage('reports')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver reporte <ArrowRight size={14} />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Unidades</th>
                <th className="pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((p, i) => (
                <tr key={p.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 text-sm font-medium text-slate-800 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
                      {i + 1}
                    </span>
                    {p.name}
                  </td>
                  <td className="py-3 text-sm text-slate-600 text-right">{p.qty}</td>
                  <td className="py-3 text-sm font-semibold text-slate-900 text-right">{fmt(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Stock bajo</h2>
              <p className="text-xs text-slate-500">3 productos</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Mouse Logitech M185', stock: 5, min: 10 },
              { name: 'Teclado Logitech K120', stock: 3, min: 10 },
              { name: 'Cable HDMI 2m', stock: 2, min: 20 },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">Mínimo: {item.min} uds</p>
                </div>
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                  {item.stock} uds
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setPage('inventory')} className="mt-4 w-full py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
            Ver inventario <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
