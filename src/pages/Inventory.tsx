import { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, XCircle, DollarSign, ArrowDown, ArrowUp, RefreshCw, X, CheckCircle, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { inventoryApi, productApi, type Product, type InventoryMovement, type InventorySummary } from '../services/api';
import { products as demoProducts, inventoryMovements as demoMovements, fmt as demoFmt } from '../data/demo';

type SubPage = 'main' | 'movements';

interface InventoryProps {
  subPage?: SubPage;
}

function fmt(value: number | string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value));
}

function mapMovementType(type: string): { label: string; color: string } {
  switch (type) {
    case 'entry':
    case 'Entrada':
      return { label: 'Entrada', color: 'bg-emerald-50 text-emerald-700' };
    case 'exit':
    case 'Salida':
      return { label: 'Salida', color: 'bg-amber-50 text-amber-700' };
    case 'adjustment':
    case 'Ajuste':
      return { label: 'Ajuste', color: 'bg-blue-50 text-blue-700' };
    case 'sale':
    case 'Venta':
      return { label: 'Venta', color: 'bg-violet-50 text-violet-700' };
    case 'return':
    case 'Devolución':
      return { label: 'Devolución', color: 'bg-emerald-50 text-emerald-700' };
    case 'damage':
    case 'Daño':
      return { label: 'Daño', color: 'bg-red-50 text-red-700' };
    default:
      return { label: type, color: 'bg-slate-100 text-slate-600' };
  }
}

function MovTypeBadge({ type }: { type: string }) {
  const { label, color } = mapMovementType(type);
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>{label}</span>;
}

// ─── Modal de Ajuste de Stock ─────────────────────────────────────────────────

function AdjustModal({
  selectedProduct,
  onClose,
  onSaved,
}: {
  selectedProduct?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [productId, setProductId]       = useState<string>(selectedProduct ? String(selectedProduct.id) : '');
  const [type, setType]                 = useState<'entry' | 'exit'>('entry');
  const [quantity, setQuantity]         = useState('');
  const [reason, setReason]             = useState('Compra a proveedor');
  const [reference, setReference]       = useState('');
  const [notes, setNotes]               = useState('');
  const [saved, setSaved]               = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    productApi.list({ per_page: 100 })
      .then((res) => {
        setProductsList(res.data);
        if (!productId && res.data.length > 0) {
          setProductId(String(res.data[0].id));
        }
      })
      .catch(() => {
        // Fallback a productos demo si no hay backend activo
      });
  }, []);

  const handleConfirm = async () => {
    if (!productId || !quantity || Number(quantity) <= 0) {
      setError('Por favor selecciona un producto e ingresa una cantidad válida.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await inventoryApi.adjust({
        product_id: Number(productId),
        type,
        quantity:   Number(quantity),
        reason,
        reference:  reference || undefined,
        notes:      notes || undefined,
      });
      setSaved(true);
      onSaved();
    } catch (err: any) {
      const msgs = err?.errors ? Object.values(err.errors as Record<string, string[]>).flat() : [];
      setError(msgs.length ? msgs.join(' · ') : err?.message || 'Error al registrar el ajuste.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Ajuste registrado</h3>
          <p className="text-sm text-slate-500 mb-6">El movimiento quedó registrado en el kardex auditable.</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Ajustar inventario</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Producto *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              {productsList.length > 0 ? (
                productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))
              ) : (
                demoProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tipo de movimiento *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('entry');
                  setReason('Compra a proveedor');
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                  type === 'entry'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <ArrowDown size={15} /> Entrada
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('exit');
                  setReason('Unidades dañadas');
                }}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer ${
                  type === 'exit'
                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <ArrowUp size={15} /> Salida
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Cantidad *</label>
            <input
              type="number"
              step="any"
              min="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Motivo *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="Compra a proveedor">Compra a proveedor</option>
              <option value="Devolución de cliente">Devolución de cliente</option>
              <option value="Ajuste por conteo">Ajuste por conteo físico</option>
              <option value="Unidades dañadas">Unidades dañadas o vencidas</option>
              <option value="Transferencia">Transferencia de almacén</option>
              <option value="Otro">Otro concepto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Referencia o documento</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: FAC-102, OC-50"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Observaciones</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Esta operación quedará registrada en el kardex inmutable y actualizará el stock inmediatamente.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Registrando...' : 'Confirmar ajuste'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página de Inventario Principal ───────────────────────────────────────────

export default function Inventory({ subPage = 'main' }: InventoryProps) {
  const [view, setView]                     = useState<SubPage>(subPage);
  const [showAdjust, setShowAdjust]         = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Datos de API
  const [summary, setSummary]               = useState<InventorySummary | null>(null);
  const [productsList, setProductsList]     = useState<Product[]>([]);
  const [movementsList, setMovementsList]   = useState<InventoryMovement[]>([]);
  const [loading, setLoading]               = useState(true);
  const [currentPage, setCurrentPage]       = useState(1);
  const [meta, setMeta]                     = useState({ current_page: 1, last_page: 1, per_page: 25, total: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes, movRes] = await Promise.all([
        inventoryApi.summary().catch(() => null),
        productApi.list({ per_page: 50 }).catch(() => null),
        inventoryApi.movements({ page: currentPage, per_page: 25 }).catch(() => null),
      ]);

      if (sumRes?.data) setSummary(sumRes.data);
      if (prodRes?.data) setProductsList(prodRes.data);
      if (movRes?.data) {
        setMovementsList(movRes.data);
        setMeta(movRes.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPIs dinámicos con fallback
  const kpis = [
    {
      label: 'Total productos',
      value: summary ? String(summary.total_products) : String(demoProducts.length),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Stock bajo',
      value: summary ? String(summary.low_stock_count) : '2',
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Agotados',
      value: summary ? String(summary.out_of_stock_count) : '0',
      icon: XCircle,
      color: 'bg-red-50 text-red-600',
    },
    {
      label: 'Valor inventario',
      value: summary ? fmt(summary.total_inventory_value) : demoFmt(85000000),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];

  const handleOpenAdjust = (prod?: Product) => {
    setSelectedProduct(prod || null);
    setShowAdjust(true);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {showAdjust && (
        <AdjustModal
          selectedProduct={selectedProduct}
          onClose={() => {
            setShowAdjust(false);
            setSelectedProduct(null);
          }}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">Control de stock y kardex en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
            {(['main', 'movements'] as SubPage[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  view === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {v === 'main' ? 'Stock' : 'Movimientos'}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleOpenAdjust()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
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

      {/* Pestaña: Stock actual */}
      {view === 'main' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Producto', 'Stock actual', 'Stock mínimo', 'Estado', 'Último movimiento', 'Acciones'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productsList.length > 0 ? (
                  productsList.map((p) => {
                    const stock = Number(p.stock);
                    const min = Number(p.stock_min);
                    const isOut = p.track_stock && stock <= 0;
                    const isLow = p.track_stock && !isOut && stock <= min;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Package size={14} className="text-slate-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                              <p className="text-xs text-slate-400 font-mono">{p.sku || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                            {stock}
                          </span>
                          <span className="text-xs text-slate-400"> {p.unit || 'uds'}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{min} {p.unit || 'uds'}</td>
                        <td className="px-5 py-4">
                          {isOut ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full w-fit">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>Agotado
                            </span>
                          ) : isLow ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>Stock bajo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>En stock
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(p.updated_at).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleOpenAdjust(p)}
                            className="text-xs px-3 py-1.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  demoProducts.map((p) => (
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
                        <button
                          onClick={() => handleOpenAdjust()}
                          className="text-xs px-3 py-1.5 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pestaña: Kardex / Movimientos */}
      {view === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Fecha / Hora', 'Producto', 'Tipo', 'Cantidad', 'Stock previo', 'Stock resultante', 'Usuario', 'Motivo', 'Ref.'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movementsList.length > 0 ? (
                  movementsList.map((m) => {
                    const qtyNum = Number(m.quantity);
                    const dateObj = new Date(m.created_at);
                    const dateFormatted = dateObj.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
                    const timeFormatted = dateObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700 whitespace-nowrap">{dateFormatted}</p>
                          <p className="text-xs text-slate-400">{timeFormatted}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">
                          {m.product?.name ?? '—'}
                          {m.product?.sku && <span className="block text-xs font-mono text-slate-400">{m.product.sku}</span>}
                        </td>
                        <td className="px-5 py-4">
                          <MovTypeBadge type={m.type} />
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-bold ${qtyNum > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {qtyNum > 0 ? `+${qtyNum}` : qtyNum}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{Number(m.previous_stock)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">{Number(m.current_stock)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {m.user?.name ?? 'Sistema'}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600 max-w-48 truncate">
                          {m.reason ?? '—'}
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-400">
                          {m.reference ?? '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  demoMovements.map((m, i) => (
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
                      <td className="px-5 py-4 text-xs font-mono text-slate-400">—</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {movementsList.length > 0 && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Mostrando página {meta.current_page} de {meta.last_page} ({meta.total} movimientos)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: meta.last_page }, (_, i) => i + 1).slice(0, 5).map((n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${
                      n === meta.current_page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page === meta.last_page}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
