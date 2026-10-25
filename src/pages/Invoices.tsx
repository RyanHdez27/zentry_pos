import { useState } from 'react';
import { Download, Printer, ChevronLeft, Search, Filter, Eye, FileText } from 'lucide-react';
import { invoices, fmt } from '../data/demo';

interface InvoicesProps {
  setPage: (p: string) => void;
  showDetail?: boolean;
}

function InvoiceDetail({ invoice, onBack }: { invoice: (typeof invoices)[0]; onBack: () => void }) {
  const items = [
    { name: 'Mouse Logitech M185', qty: 2, price: 80000, total: 160000 },
    { name: 'Audífonos JBL', qty: 1, price: 60000, total: 60000 },
  ];
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const discount = 10000;
  const tax = Math.round((subtotal - discount) * 0.19);
  const total = subtotal - discount + tax;

  return (
    <div className="p-6 space-y-5 max-w-[900px]">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ChevronLeft size={16} /> Volver a facturas
        </button>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
            <Download size={15} /> Descargar PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {/* Invoice document */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <span className="text-white font-bold text-lg">Zentry POS</span>
              </div>
              <p className="text-slate-300 text-sm font-semibold">Empresa Demo S.A.S.</p>
              <p className="text-slate-400 text-xs mt-1">NIT: 900.123.456-7</p>
              <p className="text-slate-400 text-xs">Calle 72 # 10-34, Bogotá, Colombia</p>
              <p className="text-slate-400 text-xs">Tel: (601) 234-5678</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs mb-1 uppercase tracking-wide">Factura de venta</p>
              <p className="text-white font-bold text-2xl">{invoice.id}</p>
              <p className="text-slate-400 text-sm mt-2">Fecha: {invoice.date}</p>
              <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold ${
                invoice.status === 'emitida' ? 'bg-emerald-500/20 text-emerald-300' :
                invoice.status === 'cancelada' ? 'bg-red-500/20 text-red-300' :
                'bg-slate-500/20 text-slate-300'
              }`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Client info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Cliente</p>
              <p className="text-sm font-bold text-slate-900">{invoice.customer}</p>
              <p className="text-xs text-slate-500">CC 12345678</p>
              <p className="text-xs text-slate-500">juan@email.com</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Información de pago</p>
              <p className="text-sm text-slate-700"><span className="font-medium">Método:</span> {invoice.method}</p>
              <p className="text-sm text-slate-700"><span className="font-medium">Estado:</span> Pagado</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                  <th className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Cantidad</th>
                  <th className="py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Precio unit.</th>
                  <th className="py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-4 text-sm font-medium text-slate-800">{item.name}</td>
                    <td className="py-4 text-sm text-slate-600 text-center">{item.qty}</td>
                    <td className="py-4 text-sm text-slate-600 text-right">{fmt(item.price)}</td>
                    <td className="py-4 text-sm font-semibold text-slate-900 text-right">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              {[
                { label: 'Subtotal', value: fmt(subtotal) },
                { label: 'Descuento', value: `-${fmt(discount)}`, neg: true },
                { label: 'IVA (19%)', value: fmt(tax) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`font-medium ${(row as any).neg ? 'text-emerald-600' : 'text-slate-700'}`}>{row.value}</span>
                </div>
              ))}
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between">
                <span className="font-bold text-slate-900">TOTAL</span>
                <span className="font-bold text-xl text-slate-900">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
            Gracias por su compra. Esta factura es un documento equivalente tributario.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Invoices({ setPage, showDetail }: InvoicesProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<(typeof invoices)[0] | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  if (selectedInvoice || showDetail) {
    const inv = selectedInvoice ?? invoices[0];
    return <InvoiceDetail invoice={inv} onBack={() => setSelectedInvoice(null)} />;
  }

  const filtered = invoices.filter((inv) => {
    const matchSearch = !search || inv.id.toLowerCase().includes(search.toLowerCase()) || inv.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Facturas</h1>
          <p className="text-sm text-slate-500 mt-0.5">{invoices.length} facturas emitidas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
          <Download size={15} /> Exportar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por número o cliente..." className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600 focus:outline-none focus:border-blue-500">
          <option value="">Todos los estados</option>
          <option value="emitida">Emitida</option>
          <option value="cancelada">Cancelada</option>
          <option value="borrador">Borrador</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Número', 'Cliente', 'Fecha', 'Items', 'Total', 'Método', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span className="text-sm font-mono font-semibold text-slate-800">{inv.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">{inv.customer}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{inv.date}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{inv.items} items</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-900">{fmt(inv.total)}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{inv.method}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      inv.status === 'emitida' ? 'bg-emerald-50 text-emerald-700' :
                      inv.status === 'cancelada' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Download size={15} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
