import { useState } from 'react';
import { Download, TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { salesChart, categoryChart, paymentChart, fmt } from '../data/demo';

const periods = ['Esta semana', 'Este mes', 'Este trimestre', 'Este año', 'Personalizado'];

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900">{typeof payload[0].value === 'number' && payload[0].value > 1000 ? fmt(payload[0].value) : payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const topProducts = [
  { name: 'Mouse Logitech M185', qty: 128, revenue: 10240000 },
  { name: 'Teclado Logitech K120', qty: 95, revenue: 5700000 },
  { name: 'Audífonos JBL', qty: 82, revenue: 4920000 },
  { name: 'Monitor Samsung 24"', qty: 34, revenue: 28900000 },
  { name: 'Memoria USB 64GB', qty: 71, revenue: 3195000 },
];

const salesDetail = [
  { id: 'FV-000152', date: '26 sep 2026', customer: 'Juan Pérez', total: 226100, method: 'Efectivo', items: 3 },
  { id: 'FV-000151', date: '26 sep 2026', customer: 'María González', total: 185000, method: 'Tarjeta', items: 2 },
  { id: 'FV-000150', date: '25 sep 2026', customer: 'Carlos Rodríguez', total: 950000, method: 'Transferencia', items: 1 },
  { id: 'FV-000149', date: '25 sep 2026', customer: 'Consumidor final', total: 80000, method: 'Efectivo', items: 1 },
  { id: 'FV-000148', date: '24 sep 2026', customer: 'Laura Martínez', total: 320000, method: 'Tarjeta', items: 2 },
];

export default function Reports() {
  const [period, setPeriod] = useState('Este mes');

  const kpis = [
    { label: 'Ventas totales', value: '$45.800.000', icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
    { label: 'Número de ventas', value: '1.284', icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Ticket promedio', value: '$35.670', icon: TrendingUp, color: 'bg-violet-50 text-violet-600' },
    { label: 'Clientes únicos', value: '342', icon: Users, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Análisis de ventas y rendimiento</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1 flex-wrap">
            {periods.map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${period === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
            <Download size={15} /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${k.color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">{k.value}</p>
              <p className="text-sm text-slate-500">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Ventas por día */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Ventas por día</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesChart} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ventas" stroke="#2563EB" strokeWidth={2.5} fill="url(#grad2)" dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por método de pago */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Método de pago</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentChart} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {paymentChart.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {paymentChart.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }}></span>
                  <span className="text-xs text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Ventas por categoría */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Ventas por categoría</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryChart} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Productos más vendidos</h2>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-semibold flex-shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(p.qty / 128) * 100}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-400">{p.qty} uds</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900 flex-shrink-0">{fmt(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Detalle de ventas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Factura', 'Fecha', 'Cliente', 'Items', 'Total', 'Método'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesDetail.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 text-sm font-mono font-semibold text-slate-800">{s.id}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{s.date}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{s.customer}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{s.items}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{fmt(s.total)}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{s.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
