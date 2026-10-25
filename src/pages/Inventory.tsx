import { useState } from 'react';
import { Package, AlertTriangle, XCircle, DollarSign, ArrowDown, ArrowUp, RefreshCw, X, CheckCircle, ChevronDown } from 'lucide-react';
import { products, inventoryMovements, fmt } from '../data/demo';

type SubPage = 'main' | 'movements';

interface InventoryProps {
  subPage?: SubPage;
}

function MovTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Venta: 'bg-blue-50 text-blue-700',
    Entrada: 'bg-emerald-50 text-emerald-700',
    Ajuste: 'bg-amber-50 text-amber-700',
    Devolución: 'bg-violet-50 text-violet-700',
    Daño: 'bg-red-50 text-red-700',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[type] ?? 'bg-slate-100 text-slate-600'}`}>{type}</span>;
}

function AdjustModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState('Entrada');
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Ajuste registrado</h3>
          <p className="text-sm text-slate-500 mb-6">El movimiento quedó registrado en el historial.</p>
          <button onClick={onClose} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Ajustar inventario</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Producto</label>
            <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
              {products.map((p) => <option key={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de movimiento</label>
            <div className="grid grid-cols-2 gap-2">
              {['Entrada', 'Salida'].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    type === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t === 'Entrada' ? <ArrowDown size={15} /> : <ArrowUp size={15} />} {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Cantidad</label>
            <input type="number" placeholder="0" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Motivo</label>
            <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
              {['Compra a proveedor', 'Devolución de cliente', 'Ajuste por conteo', 'Unidades dañadas', 'Transferencia', 'Otro'].map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observaciones</label>
            <textarea rows={2} placeholder="Detalles adicionales..." className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Esta operación quedará registrada en el historial de inventario y no puede deshacerse.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button onClick={() => setSaved(true)} className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Confirmar ajuste</button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory({ subPage = 'main' }: InventoryProps) {
  const [view, setView] = useState<SubPage>(subPage);
  const [showAdjust, setShowAdjust] = useState(false);

  const kpis = [
    { label: 'Total productos', value: '1.245', icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Stock bajo', value: '24', icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
    { label: 'Agotados', value: '8', icon: XCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Valor inventario', value: '$85.000.000', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {showAdjust && <AdjustModal onClose={() => setShowAdjust(false)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">Control de stock en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
            {(['main', 'movements'] as SubPage[]).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {v === 'main' ? 'Stock' : 'Movimientos'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdjust(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            <RefreshCw size={15} /> Ajustar inventario
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${k.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{k.value}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {view === 'main' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Producto', 'Stock actual', 'Stock mínimo', 'Estado', 'Último movimiento', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : p.stock < p.minStock ? 'text-amber-600' : 'text-slate-900'}`}>
                        {p.stock}
                      </span>
                      <span className="text-xs text-slate-400"> uds</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{p.minStock} uds</td>
                    <td className="px-5 py-4">
                      {p.status === 'ok' && <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>En stock</span>}
                      {p.status === 'low' && <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>Stock bajo</span>}
                      {p.status === 'out' && <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full w-fit"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>Agotado</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">26 sep 2026</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setShowAdjust(true)} className="text-xs px-3 py-1.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                        Ajustar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock anterior', 'Stock resultante', 'Usuario', 'Motivo'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryMovements.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700 whitespace-nowrap">{m.date}</p>
                      <p className="text-xs text-slate-400">{m.time}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">{m.product}</td>
                    <td className="px-5 py-4"><MovTypeBadge type={m.type} /></td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${m.qty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.qty > 0 ? '+' : ''}{m.qty}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{m.before}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{m.after}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">{m.user}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 max-w-40 truncate">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
