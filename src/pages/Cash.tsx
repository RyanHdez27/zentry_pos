import { useState } from 'react';
import { DollarSign, ArrowDown, ArrowUp, X, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { fmt } from '../data/demo';

type CashModal = 'none' | 'movement' | 'close' | 'closed';

export default function Cash() {
  const [isOpen, setIsOpen] = useState(true);
  const [modal, setModal] = useState<CashModal>('none');
  const [movType, setMovType] = useState('Ingreso');
  const [initialAmt, setInitialAmt] = useState(200000);
  const [counted, setCounted] = useState(2095000);

  const stats = {
    initial: 200000,
    sales: 1850000,
    income: 100000,
    withdrawals: 50000,
    expected: 2100000,
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Caja</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gestión del flujo de efectivo</p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Caja principal</h2>
            </div>
            {isOpen ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Abierta
                </span>
                <span className="text-sm text-slate-500">Usuario: Carlos Rodríguez</span>
                <span className="text-sm text-slate-500">Apertura: 08:00 AM</span>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Cerrada
              </span>
            )}
          </div>

          {isOpen ? (
            <div className="flex gap-2">
              <button onClick={() => setModal('movement')} className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                <ArrowDown size={15} /> Registrar movimiento
              </button>
              <button onClick={() => setModal('close')} className="flex items-center gap-2 px-4 py-2.5 text-sm bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors">
                Cerrar caja
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <label className="text-xs font-medium text-slate-600">Monto inicial</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={initialAmt}
                  onChange={(e) => setInitialAmt(Number(e.target.value))}
                  className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
                <button onClick={() => setIsOpen(true)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Abrir caja
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {isOpen && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Monto inicial', value: fmt(stats.initial), color: 'text-slate-700', bg: 'bg-slate-50' },
              { label: 'Ventas', value: fmt(stats.sales), color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Ingresos', value: fmt(stats.income), color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Retiros', value: fmt(stats.withdrawals), color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Efectivo esperado', value: fmt(stats.expected), color: 'text-slate-900 font-bold', bg: 'bg-slate-100' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Movement history */}
      {isOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">Movimientos del día</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Hora', 'Tipo', 'Descripción', 'Monto'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { time: '08:00 AM', type: 'Apertura', desc: 'Apertura de caja — monto inicial', amount: 200000, sign: 1 },
                { time: '09:05 AM', type: 'Venta', desc: 'Venta #FV-000148', amount: 85000, sign: 1 },
                { time: '09:30 AM', type: 'Venta', desc: 'Venta #FV-000149', amount: 320000, sign: 1 },
                { time: '10:15 AM', type: 'Retiro', desc: 'Retiro parcial', amount: 50000, sign: -1 },
                { time: '10:31 AM', type: 'Venta', desc: 'Venta #FV-000152', amount: 226100, sign: 1 },
                { time: '11:00 AM', type: 'Ingreso', desc: 'Pago de deuda cliente', amount: 100000, sign: 1 },
              ].map((m, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{m.time}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      m.type === 'Venta' ? 'bg-blue-50 text-blue-700' :
                      m.type === 'Retiro' ? 'bg-red-50 text-red-700' :
                      m.type === 'Ingreso' ? 'bg-violet-50 text-violet-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{m.type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{m.desc}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-bold ${m.sign > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {m.sign > 0 ? '+' : '-'}{fmt(m.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Movement modal */}
      {modal === 'movement' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Registrar movimiento</h2>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Ingreso', 'Egreso', 'Retiro'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setMovType(t)}
                      className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${movType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Monto</label>
                <input type="number" placeholder="$0" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Descripción</label>
                <textarea rows={2} placeholder="Motivo del movimiento..." className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setModal('none')} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button onClick={() => setModal('none')} className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Close modal */}
      {modal === 'close' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Cerrar caja</h2>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                {[
                  ['Efectivo esperado', fmt(stats.expected)],
                  ['Efectivo contado', fmt(counted)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-900">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Diferencia</span>
                  <span className={`font-bold ${counted - stats.expected < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {counted - stats.expected < 0 ? '-' : '+'}{fmt(Math.abs(counted - stats.expected))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Efectivo contado</label>
                <input type="number" value={counted} onChange={(e) => setCounted(Number(e.target.value))} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>

              {Math.abs(counted - stats.expected) > 0 && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">Existe una diferencia en el efectivo. Por favor verifica el conteo o agrega una observación.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Observación</label>
                <textarea rows={2} placeholder="Explica la diferencia si existe..." className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={() => setModal('none')} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
              <button onClick={() => { setIsOpen(false); setModal('none'); }} className="px-5 py-2.5 text-sm bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900">Confirmar cierre</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
