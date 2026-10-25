import { useState } from 'react';
import { ChevronLeft, Package, Edit, Trash2 } from 'lucide-react';
import { products, inventoryMovements, fmt } from '../data/demo';

interface ProductDetailProps {
  onBack: () => void;
}

export default function ProductDetail({ onBack }: ProductDetailProps) {
  const [tab, setTab] = useState('info');
  const product = products[0];

  const tabs = ['Información', 'Inventario', 'Movimientos', 'Ventas'];

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ChevronLeft size={16} /> Volver a productos
        </button>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"><Edit size={14} /> Editar</button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={14} /> Eliminar</button>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-wrap gap-6">
          <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Package size={36} className="text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900 mb-1">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-slate-500 font-mono">SKU: {product.sku}</span>
                  <span className="text-sm text-slate-500 font-mono">EAN: {product.barcode}</span>
                  <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">{product.category}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${product.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : product.status === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {product.status === 'ok' ? 'En stock' : product.status === 'low' ? 'Stock bajo' : 'Agotado'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{fmt(product.price)}</p>
                <p className="text-sm text-slate-500">Precio de venta</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
              {[
                ['Precio de compra', fmt(product.cost)],
                ['Stock actual', `${product.stock} uds`],
                ['Stock mínimo', `${product.minStock} uds`],
                ['IVA', `${product.tax}%`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 px-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-4 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'Información' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
              {[
                ['Nombre', product.name],
                ['SKU', product.sku],
                ['Código de barras', product.barcode],
                ['Categoría', product.category],
                ['Unidad', product.unit],
                ['Precio de compra', fmt(product.cost)],
                ['Precio de venta', fmt(product.price)],
                ['IVA', `${product.tax}%`],
              ].map(([k, v]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{k}</label>
                  <p className="text-sm font-medium text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'Inventario' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
              {[
                { label: 'Stock actual', value: `${product.stock}`, unit: 'unidades', color: product.stock < product.minStock ? 'text-amber-600' : 'text-emerald-600' },
                { label: 'Stock mínimo', value: `${product.minStock}`, unit: 'unidades', color: 'text-slate-800' },
                { label: 'Estado', value: product.status === 'ok' ? 'En stock' : 'Stock bajo', unit: '', color: product.status === 'ok' ? 'text-emerald-600' : 'text-amber-600' },
                { label: 'Último movimiento', value: '26 sep 2026', unit: '', color: 'text-slate-800' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  {item.unit && <p className="text-xs text-slate-400">{item.unit}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === 'Movimientos' && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Fecha', 'Tipo', 'Cantidad', 'Stock', 'Usuario'].map((h) => (
                    <th key={h} className="pb-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryMovements.filter((m) => m.product === product.name || true).slice(0, 5).map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3.5 text-sm text-slate-600">{m.date} {m.time}</td>
                    <td className="py-3.5"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m.type === 'Venta' ? 'bg-blue-50 text-blue-700' : m.type === 'Entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{m.type}</span></td>
                    <td className="py-3.5"><span className={`text-sm font-bold ${m.qty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{m.qty > 0 ? '+' : ''}{m.qty}</span></td>
                    <td className="py-3.5 text-sm text-slate-800 font-semibold">{m.after}</td>
                    <td className="py-3.5 text-sm text-slate-600">{m.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'Ventas' && (
            <div className="text-center py-12 text-slate-400">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Las ventas se cargarán desde el historial de transacciones.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
