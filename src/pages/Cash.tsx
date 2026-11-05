import { useState, useEffect } from 'react';
import { DollarSign, ArrowDown, ArrowUp, X, AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { fmt } from '../data/demo';
import { cashApi, CashSession, CashMovement, CashSummary, tokenStorage } from '../services/api';

type CashModal = 'none' | 'movement' | 'close' | 'closed';

export default function Cash() {
  const currentUser = tokenStorage.getUser();
  const [session, setSession] = useState<CashSession | null>(null);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<CashModal>('none');
  const [movType, setMovType] = useState<'Ingreso' | 'Egreso' | 'Retiro'>('Ingreso');
  const [movAmount, setMovAmount] = useState('');
  const [movDesc, setMovDesc] = useState('');
  const [movRef, setMovRef] = useState('');

  const [initialAmt, setInitialAmt] = useState<number>(0);
  const [counted, setCounted] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [closeSummary, setCloseSummary] = useState<any | null>(null);

  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cashApi.getCurrent();
      if (res.data?.session) {
        setSession(res.data.session);
        setSummary(res.data.summary);
        setMovements(res.data.movements || []);
        if (res.data.summary?.expected) {
          setCounted(res.data.summary.expected);
        }
      } else {
        setSession(null);
        setSummary(null);
        setMovements([]);
      }
    } catch (err: any) {
      setSession(null);
      setSummary(null);
      setMovements([]);
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleOpenCash = async () => {
    if (initialAmt < 0) return;
    setSubmitting(true);
    try {
      await cashApi.open({ opening_amount: initialAmt, notes: 'Apertura desde POS' });
      await fetchSession();
    } catch (err: any) {
      alert(err.message || 'Error al abrir caja');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordMovement = async () => {
    if (!session || !movAmount || Number(movAmount) <= 0 || !movDesc) return;
    setSubmitting(true);

    const apiType = movType === 'Ingreso' ? 'income' : movType === 'Retiro' ? 'withdrawal' : 'expense';

    try {
      await cashApi.recordMovement(session.id, {
        type: apiType,
        amount: Number(movAmount),
        description: movDesc,
        reference: movRef || undefined,
      });
      setModal('none');
      setMovAmount('');
      setMovDesc('');
      setMovRef('');
      await fetchSession();
    } catch (err: any) {
      alert(err.message || 'Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseCash = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const result = await cashApi.close(session.id, {
        closing_amount: counted,
        notes: closeNotes || undefined,
      });
      setCloseSummary({ ...result.data.close_summary, summary: result.data.summary, session: result.data.session });
      setModal('none');
      setCloseNotes('');
      await fetchSession();
    } catch (err: any) {
      alert(err.message || 'Error al cerrar caja');
    } finally {
      setSubmitting(false);
    }
  };

  const isOpen = session?.status === 'open';
  const expectedAmount = summary?.expected ?? Number(session?.expected_amount || 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Caja</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestión y control de turnos y flujo de efectivo</p>
        </div>
        <button
          onClick={fetchSession}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Caja principal</h2>
            </div>
            {isOpen ? (
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Abierta
                </span>
                <span className="text-sm text-slate-500">
                  Usuario: <strong className="text-slate-700">{session?.user?.name || currentUser?.name || 'Usuario'}</strong>
                </span>
                {session?.opened_at && (
                  <span className="text-sm text-slate-500">
                    Apertura: {new Date(session.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Cerrada
              </span>
            )}
          </div>

          {isOpen ? (
            <div className="flex gap-2">
              <button
                onClick={() => setModal('movement')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ArrowDown size={15} /> Registrar movimiento
              </button>
              <button
                onClick={() => {
                  setCounted(expectedAmount);
                  setModal('close');
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors shadow-sm"
              >
                Cerrar caja
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <label className="text-xs font-medium text-slate-600">Monto inicial para apertura</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={initialAmt}
                  onChange={(e) => setInitialAmt(Number(e.target.value))}
                  placeholder="0"
                  className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleOpenCash}
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Abrir caja
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {isOpen && summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Monto inicial', value: fmt(summary.initial), color: 'text-slate-700', bg: 'bg-slate-50' },
              { label: 'Ventas (Efectivo)', value: fmt(summary.sales), color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Ingresos manuales', value: fmt(summary.income), color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Retiros y egresos', value: fmt(summary.withdrawals), color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Efectivo esperado', value: fmt(summary.expected), color: 'text-slate-900 font-bold', bg: 'bg-slate-100' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {closeSummary && !isOpen && <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm space-y-4"><div><h2 className="text-lg font-bold text-slate-900">Resumen del cierre</h2><p className="text-sm text-slate-500">Cerró {closeSummary.session?.user?.name || 'usuario'} · {closeSummary.session?.closed_at ? new Date(closeSummary.session.closed_at).toLocaleString('es-CO') : ''}</p></div><div className="grid grid-cols-2 gap-3 md:grid-cols-5"><div className="rounded-lg bg-blue-50 p-3"><p className="text-xs text-slate-500">Ventas</p><p className="font-bold">{closeSummary.sales_count} · {fmt(closeSummary.sales_total)}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-xs text-slate-500">Ingresos de inventario</p><p className="font-bold">{closeSummary.stock_entries_count} movimientos · {closeSummary.stock_entries_quantity} uds</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Balance esperado</p><p className="font-bold">{fmt(closeSummary.summary.expected)}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-slate-500">Efectivo contado</p><p className="font-bold">{fmt(Number(closeSummary.session.closing_amount))}</p></div><div className="rounded-lg bg-violet-50 p-3"><p className="text-xs text-slate-500">Diferencia</p><p className="font-bold">{fmt(Number(closeSummary.session.difference))}</p></div></div><div className="grid gap-4 lg:grid-cols-3"><div><h3 className="mb-2 text-sm font-semibold">Ventas realizadas</h3><div className="space-y-1 text-xs">{closeSummary.sales.map((sale: any) => <div key={sale.id} className="flex justify-between border-b py-1"><span>{sale.invoice_number} · {sale.user?.name || 'Usuario'}</span><b>{fmt(Number(sale.total))}</b></div>)}{closeSummary.sales.length === 0 && <p className="text-slate-400">Sin ventas en este turno.</p>}</div></div><div><h3 className="mb-2 text-sm font-semibold">Ingresos de stock</h3><div className="space-y-1 text-xs">{closeSummary.stock_entries.map((move: any) => <div key={move.id} className="flex justify-between border-b py-1"><span>{move.product?.name} · {move.user?.name || 'Usuario'}</span><b>+{move.quantity}</b></div>)}{closeSummary.stock_entries.length === 0 && <p className="text-slate-400">Sin ingresos de inventario en este turno.</p>}</div></div><div><h3 className="mb-2 text-sm font-semibold">Movimientos de caja</h3><div className="space-y-1 text-xs">{closeSummary.cash_movements.map((move: any) => <div key={move.id} className="flex justify-between border-b py-1"><span>{move.description} · {move.user?.name || 'Usuario'}</span><b>{fmt(Number(move.amount))}</b></div>)}{closeSummary.cash_movements.length === 0 && <p className="text-slate-400">Sin movimientos adicionales.</p>}</div></div></div></section>}

      {/* Movement history */}
      {isOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-base font-semibold text-slate-900">Movimientos del turno</h3>
            <span className="text-xs text-slate-500">{movements.length} transacciones registradas</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Hora', 'Tipo', 'Descripción', 'Referencia', 'Monto'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => {
                const isPositive = m.type === 'income' || m.type === 'sale';
                const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                const typeLabel =
                  m.type === 'sale' ? 'Venta' :
                  m.type === 'income' ? 'Ingreso' :
                  m.type === 'withdrawal' ? 'Retiro' :
                  m.type === 'cancellation' ? 'Anulación' : 'Egreso';

                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{time}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        m.type === 'sale' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        m.type === 'withdrawal' ? 'bg-red-50 text-red-700 border border-red-100' :
                        m.type === 'income' ? 'bg-violet-50 text-violet-700 border border-violet-100' :
                        m.type === 'cancellation' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-100 text-slate-600'
                      }`}>{typeLabel}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700">{m.description}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{m.reference || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isPositive ? '+' : '-'}{fmt(Number(m.amount))}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                    No se han registrado movimientos adicionales en este turno.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Movement modal */}
      {modal === 'movement' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Registrar movimiento</h2>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Tipo de movimiento</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Ingreso', 'Egreso', 'Retiro'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMovType(t)}
                      className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${movType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Monto ($)</label>
                <input
                  type="number"
                  value={movAmount}
                  onChange={(e) => setMovAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Descripción</label>
                <textarea
                  rows={2}
                  value={movDesc}
                  onChange={(e) => setMovDesc(e.target.value)}
                  placeholder="Motivo del movimiento..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Referencia o documento (opcional)</label>
                <input
                  type="text"
                  value={movRef}
                  onChange={(e) => setMovRef(e.target.value)}
                  placeholder="Ej. REC-001 / FACT-99"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setModal('none')} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-white">Cancelar</button>
              <button
                onClick={handleRecordMovement}
                disabled={submitting || !movAmount || Number(movAmount) <= 0 || !movDesc}
                className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close modal */}
      {modal === 'close' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Cerrar caja y arqueo</h2>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Efectivo esperado</span>
                  <span className="font-semibold text-slate-900">{fmt(expectedAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Efectivo contado</span>
                  <span className="font-semibold text-slate-900">{fmt(counted)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Diferencia</span>
                  <span className={`font-bold ${counted - expectedAmount < 0 ? 'text-red-500' : counted - expectedAmount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {counted - expectedAmount < 0 ? '-' : counted - expectedAmount > 0 ? '+' : ''}{fmt(Math.abs(counted - expectedAmount))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Efectivo contado en gaveta</label>
                <input
                  type="number"
                  value={counted}
                  onChange={(e) => setCounted(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {Math.abs(counted - expectedAmount) > 0 && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Existe una diferencia de {fmt(Math.abs(counted - expectedAmount))} en el arqueo. Te recomendamos registrar una observación.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Observaciones de cierre</label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Detalles sobre el turno o la diferencia..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setModal('none')} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-white">Cancelar</button>
              <button
                onClick={handleCloseCash}
                disabled={submitting}
                className="px-5 py-2.5 text-sm bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors shadow-sm flex items-center gap-1.5"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Confirmar cierre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
