import { useState } from 'react';
import { Search, Plus, Eye, Pencil, ChevronLeft, ChevronRight, X, Phone, Mail, FileText, ShoppingCart, TrendingUp } from 'lucide-react';
import { customers, invoices, fmt } from '../data/demo';

interface CustomersProps {
  setPage: (p: string) => void;
  showDetail?: boolean;
}

function CustomerDetail({ customer, onBack }: { customer: (typeof customers)[0]; onBack: () => void }) {
  const [tab, setTab] = useState('info');
  const customerInvoices = invoices.filter((inv) => inv.customer === customer.name);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ChevronLeft size={16} /> Volver a clientes
      </button>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {customer.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
            <p className="text-slate-500 text-sm">{customer.doc}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-slate-600"><Phone size={14} /> {customer.phone}</span>
              <span className="flex items-center gap-1.5 text-sm text-slate-600"><Mail size={14} /> {customer.email}</span>
            </div>
          </div>
          <div className="ml-auto">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${customer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {customer.status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total comprado', value: fmt(customer.total), icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
          { label: 'Compras', value: String(customer.purchases), icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Última compra', value: customer.lastPurchase, icon: FileText, color: 'bg-violet-50 text-violet-600' },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${k.color}`}><Icon size={20} /></div>
              <div>
                <p className="text-xl font-bold text-slate-900">{k.value}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 px-5">
          {['info', 'compras', 'facturas'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3.5 text-sm font-medium capitalize border-b-2 transition-all -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'info' ? 'Información' : t === 'compras' ? 'Compras' : 'Facturas'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'info' && (
            <div className="grid md:grid-cols-2 gap-6">
              {[
                ['Nombre completo', customer.name],
                ['Documento', customer.doc],
                ['Teléfono', customer.phone],
                ['Email', customer.email],
                ['Estado', customer.status === 'active' ? 'Activo' : 'Inactivo'],
                ['Última compra', customer.lastPurchase],
              ].map(([k, v]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{k}</label>
                  <p className="text-sm font-medium text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          )}

          {(tab === 'compras' || tab === 'facturas') && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Número', 'Fecha', 'Total', 'Estado'].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(customerInvoices.length > 0 ? customerInvoices : invoices.slice(0, 3)).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3.5 text-sm font-mono font-semibold text-slate-800">{inv.id}</td>
                    <td className="py-3.5 text-sm text-slate-600">{inv.date}</td>
                    <td className="py-3.5 text-sm font-bold text-slate-900">{fmt(inv.total)}</td>
                    <td className="py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        inv.status === 'emitida' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'cancelada' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Customers({ setPage, showDetail }: CustomersProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<(typeof customers)[0] | null>(null);

  if (selected || showDetail) {
    const c = selected ?? customers[0];
    return <CustomerDetail customer={c} onBack={() => setSelected(null)} />;
  }

  const filtered = customers.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.doc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{customers.length} clientes registrados</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Cliente', 'Documento', 'Teléfono', 'Email', 'Compras', 'Última compra', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                        {c.name[0]}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{c.doc}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{c.phone}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{c.email}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{c.purchases}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{c.lastPurchase}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">Mostrando {filtered.length} de {customers.length} clientes</p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"><ChevronLeft size={16} /></button>
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-medium">1</button>
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
