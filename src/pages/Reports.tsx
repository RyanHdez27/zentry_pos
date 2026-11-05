import { useState, useEffect } from 'react';
import { Download, TrendingUp, ShoppingCart, Users, DollarSign, RefreshCw, Printer } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { fmt } from '../data/demo';
import { dashboardApi, ReportsSummary, tokenStorage } from '../services/api';

const periods = ['Esta semana', 'Este mes', 'Este año', 'Personalizado'];
const dateInput = (d: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
};

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
const paymentLabels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito', other: 'Otro' };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-900">
          {typeof payload[0].value === 'number' && payload[0].value > 1000
            ? fmt(payload[0].value)
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [period, setPeriod] = useState('Este mes');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportsData, setReportsData] = useState<ReportsSummary | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let dateFrom = '';
      let dateTo = dateInput(now);

      if (period === 'Personalizado') {
        dateFrom = customFrom;
        dateTo = customTo;
      } else if (period === 'Esta semana') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        dateFrom = dateInput(d);
      } else if (period === 'Este mes') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFrom = dateInput(d);
      } else if (period === 'Este año') {
        const d = new Date(now.getFullYear(), 0, 1);
        dateFrom = dateInput(d);
      }

      const res = await dashboardApi.getReports({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
      if (res.data) {
        setReportsData(res.data);
      }
    } catch (e: any) {
      console.warn('Usando datos de reporte demo:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [period, customFrom, customTo]);

  const totalRev = reportsData?.summary.total_revenue ?? 0;
  const totalSales = reportsData?.summary.total_sales ?? 0;
  const avgTicket = reportsData?.summary.avg_ticket ?? 0;
  const uniqueCust = reportsData?.summary.unique_customers ?? 0;
  const grossMargin = reportsData?.summary.gross_margin ?? 0;
  const marginPct = reportsData?.summary.gross_margin_percentage ?? 0;

  const kpis = [
    { label: 'Ventas totales', value: fmt(totalRev), icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
    { label: 'Número de ventas', value: String(totalSales), icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Ticket promedio', value: fmt(avgTicket), icon: TrendingUp, color: 'bg-violet-50 text-violet-600' },
    { label: 'Margen comercial estimado', value: `${fmt(grossMargin)} (${marginPct}%)`, icon: Users, color: 'bg-amber-50 text-amber-600' },
  ];

  const cashiers = reportsData?.by_cashier ?? [];
  const salesChart = reportsData?.sales_chart ?? [];
  const payments = reportsData?.payments_distribution ?? [];
  const paymentsTotal = payments.reduce((sum, row) => sum + row.amount, 0);
  const paymentChart = payments.map(row => ({ name: paymentLabels[row.method] || row.method, amount: row.amount, value: paymentsTotal ? row.amount / paymentsTotal * 100 : 0 }));
  const company = tokenStorage.getCompany();
  const rangeLabel = period === 'Personalizado'
    ? `${customFrom || 'Sin inicio'} al ${customTo || 'hoy'}`
    : period === 'Esta semana'
      ? `${dateInput(new Date(new Date().setDate(new Date().getDate() - 7)))} al ${dateInput(new Date())}`
      : period === 'Este año'
        ? `1 ene ${new Date().getFullYear()} al ${dateInput(new Date())}`
        : `${period} · ${period === 'Este mes' ? new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date()) : dateInput(new Date())}`;

  const handlePrint = () => window.print();

  return (
    <>
    <div className="screen-report p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes de Rendimiento</h1>
          <p className="text-sm text-slate-500 mt-0.5">Análisis de ventas, márgenes y rendimiento comercial</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1 flex-wrap shadow-xs">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  period === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {period === 'Personalizado' && <div className="flex items-center gap-2"><label className="text-xs text-slate-500">Desde <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"/></label><label className="text-xs text-slate-500">Hasta <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"/></label></div>}
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition-colors shadow-xs"
          >
            <Printer size={15} /> Imprimir reporte
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
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
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Tendencia de ventas</h2>
          <ResponsiveContainer width="100%" height={220}>
            {salesChart.length > 0 ? <AreaChart data={salesChart} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="total"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#grad2)"
                dot={{ r: 4, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart> : <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">No hay ventas en este rango de fechas.</div>}
          </ResponsiveContainer>
        </div>

        {/* Ventas por método de pago */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Métodos de pago</h2>
          <ResponsiveContainer width="100%" height={200}>
            {paymentChart.length > 0 ? <PieChart>
              <Pie
                data={paymentChart}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {paymentChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, _name, item) => [`${Number(v).toFixed(1)}% · ${fmt((item?.payload as any)?.amount || 0)}`, 'Participación']} />
            </PieChart> : <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">No hay pagos registrados en este rango.</div>}
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {paymentChart.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-semibold text-slate-800">{item.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 — Ventas por Cajero */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Rendimiento por Cajero / Vendedor</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Colaborador</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Ventas procesadas</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Monto Total</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ticket promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashiers.map((c) => {
                const avg = c.sales > 0 ? c.total / c.sales : 0;
                return (
                  <tr key={c.name} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{c.name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 text-center font-medium">{c.sales}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900 text-right">{fmt(c.total)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 text-right">{fmt(avg)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <section className="print-report hidden p-8 text-slate-900">
      <header className="mb-6 flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <div><h1 className="text-2xl font-bold">{company?.name || 'Zentry POS'}</h1><p>{company?.legal_name || ''}</p><p>{[company?.tax_id ? `NIT: ${company.tax_id}` : '', company?.phone || '', company?.email || '', company?.address || ''].filter(Boolean).join(' · ')}</p></div>
        <div className="text-right"><h2 className="text-xl font-bold">Reporte de rendimiento</h2><p>Periodo: {rangeLabel}</p><p>Generado: {new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date())}</p></div>
      </header>
      <h3 className="mb-2 text-base font-bold">Resumen ejecutivo</h3>
      <table className="mb-6 w-full border-collapse"><tbody><tr>{[
        ['Ingresos', fmt(totalRev)], ['Ventas', String(totalSales)], ['Ticket promedio', fmt(avgTicket)], ['Clientes', String(uniqueCust)],
      ].map(([label, value]) => <td key={label} className="border border-slate-300 p-3"><strong className="block text-xs uppercase text-slate-500">{label}</strong><span className="text-lg font-bold">{value}</span></td>)}</tr><tr>{[
        ['Costo estimado', fmt(reportsData?.summary.total_cost ?? 0)], ['Margen bruto', fmt(grossMargin)], ['Margen %', `${marginPct}%`], ['Transacciones', String(totalSales)],
      ].map(([label, value]) => <td key={label} className="border border-slate-300 p-3"><strong className="block text-xs uppercase text-slate-500">{label}</strong><span className="text-lg font-bold">{value}</span></td>)}</tr></tbody></table>
      <div className="mb-5 grid grid-cols-2 gap-6">
        <div><h3 className="mb-2 font-bold">Ventas por día</h3><table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2 text-left">Fecha</th><th className="border p-2 text-right">Ventas</th><th className="border p-2 text-right">Ingresos</th></tr></thead><tbody>{salesChart.map(row => <tr key={row.date}><td className="border p-2">{row.day} ({row.date})</td><td className="border p-2 text-right">{row.sales}</td><td className="border p-2 text-right">{fmt(row.total)}</td></tr>)}{!salesChart.length && <tr><td className="border p-2" colSpan={3}>Sin ventas en el periodo.</td></tr>}</tbody></table></div>
        <div><h3 className="mb-2 font-bold">Medios de pago</h3><table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2 text-left">Medio</th><th className="border p-2 text-right">Monto</th><th className="border p-2 text-right">Participación</th></tr></thead><tbody>{paymentChart.map(row => <tr key={row.name}><td className="border p-2">{row.name}</td><td className="border p-2 text-right">{fmt(row.amount)}</td><td className="border p-2 text-right">{row.value.toFixed(1)}%</td></tr>)}{!paymentChart.length && <tr><td className="border p-2" colSpan={3}>Sin pagos en el periodo.</td></tr>}</tbody></table></div>
      </div>
      <h3 className="mb-2 font-bold">Rendimiento por vendedor</h3><table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2 text-left">Colaborador</th><th className="border p-2 text-right">Ventas</th><th className="border p-2 text-right">Ingresos</th><th className="border p-2 text-right">Ticket promedio</th></tr></thead><tbody>{cashiers.map(row => <tr key={row.user_id}><td className="border p-2">{row.name}</td><td className="border p-2 text-right">{row.sales}</td><td className="border p-2 text-right">{fmt(row.total)}</td><td className="border p-2 text-right">{fmt(row.sales ? row.total / row.sales : 0)}</td></tr>)}{!cashiers.length && <tr><td className="border p-2" colSpan={4}>Sin ventas registradas.</td></tr>}</tbody></table>
      <p className="mt-8 border-t pt-3 text-xs text-slate-500">Reporte generado desde Zentry POS · Los valores se basan en ventas completadas del periodo seleccionado.</p>
    </section>
    </>
  );
}
