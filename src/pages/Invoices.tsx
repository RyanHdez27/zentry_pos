import { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  ChevronLeft,
  Search,
  Filter,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { invoices as demoInvoices, fmt } from '../data/demo';
import { saleApi, Sale, tokenStorage } from '../services/api';
import { printReceipt } from '../utils/printReceipt';

interface InvoicesProps {
  setPage: (p: string) => void;
  showDetail?: boolean;
}

function InvoiceDetail({
  invoice,
  onBack,
  onCancelSuccess,
}: {
  invoice: any;
  onBack: () => void;
  onCancelSuccess?: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const currentUser = tokenStorage.getUser();
  const currentCompany = tokenStorage.getCompany();
  const isAdmin = currentUser?.role === 'admin';

  const items = invoice.items || [];

  const subtotal = Number(invoice.subtotal ?? 0);
  const discount = Number(invoice.discount_amount ?? 0);
  const tax = Number(invoice.tax_amount ?? 0);
  const total = Number(invoice.total ?? 0);
  const status = invoice.status || 'completed';

  const customerName = invoice.customer?.name || invoice.customer || 'Consumidor final';
  const customerDoc = invoice.customer?.document_number || '—';
  const customerEmail = invoice.customer?.email || '—';

  const paymentMethod =
    invoice.payments?.[0]?.payment_method ||
    invoice.method ||
    '—';

  const handlePrint = () => {
    printReceipt(invoice);
  };

  const handleCancelSale = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      await saleApi.cancel(invoice.id, cancelReason);
      setCancelModal(false);
      if (onCancelSuccess) onCancelSuccess();
      onBack();
    } catch (e: any) {
      alert(e.message || 'Error al anular venta');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[900px] print:p-0 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={16} /> Volver a facturas
        </button>
        <div className="flex items-center gap-2">
          {isAdmin && status !== 'cancelled' && (
            <button
              onClick={() => setCancelModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <XCircle size={15} /> Anular venta
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm font-semibold"
          >
            <Printer size={15} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm print:border-none print:shadow-none">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <span className="text-white font-bold text-lg">{currentCompany?.name || 'Empresa'}</span>
              </div>
              <p className="text-slate-300 text-sm font-semibold">{(currentCompany as any)?.legal_name || ''}</p>
              {currentCompany?.tax_id && <p className="text-slate-400 text-xs mt-1">NIT: {currentCompany.tax_id}</p>}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider font-semibold">
                Factura Electrónica de Venta
              </p>
              <p className="text-white font-bold text-2xl font-mono">
                {invoice.invoice_number || invoice.id}
              </p>
              <p className="text-slate-400 text-sm mt-1.5">
                Fecha:{' '}
                {invoice.created_at
                  ? new Date(invoice.created_at).toLocaleDateString()
                  : invoice.date || '31/10/2026'}
              </p>
              <span
                className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold ${
                  status === 'completed' || status === 'emitida'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {status === 'completed' || status === 'emitida' ? 'Emitida / Pagada' : 'Cancelada / Anulada'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Client info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Datos del Cliente
              </p>
              <p className="text-sm font-bold text-slate-900">{customerName}</p>
              <p className="text-xs text-slate-500">Doc: {customerDoc}</p>
              <p className="text-xs text-slate-500">Correo: {customerEmail}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Forma de Pago & Cajero
              </p>
              <p className="text-sm text-slate-700 capitalize">
                <span className="font-medium text-slate-500">Método:</span> {paymentMethod}
              </p>
              <p className="text-sm text-slate-700">
                <span className="font-medium text-slate-500">Cajero:</span>{' '}
                {invoice.user?.name || '—'}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Producto / Descripción
                  </th>
                  <th className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Cant.
                  </th>
                  <th className="py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Precio unit.
                  </th>
                  <th className="py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item: any, i: number) => {
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.unit_price || 0);
                  const itemTotal = Number(item.total || qty * price);

                  return (
                    <tr key={i}>
                      <td className="py-3.5 text-sm font-medium text-slate-800">
                        {item.product_name || item.name}
                        {item.product_sku && (
                          <span className="block text-xs text-slate-400 font-mono">
                            SKU: {item.product_sku}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-sm text-slate-600 text-center">{qty}</td>
                      <td className="py-3.5 text-sm text-slate-600 text-right">{fmt(price)}</td>
                      <td className="py-3.5 text-sm font-semibold text-slate-900 text-right">
                        {fmt(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-700">{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Descuento</span>
                  <span className="font-medium text-emerald-600">-{fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">IVA (19%)</span>
                <span className="font-medium text-slate-700">{fmt(tax)}</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-base">TOTAL</span>
                <span className="font-bold text-2xl text-slate-900">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
            Esta factura constituye título valor de acuerdo con la normatividad tributaria vigente.
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Confirmar anulación de venta</h3>
            <p className="text-xs text-slate-500">
              Esta acción restituirá las existencias en inventario y revertirá el flujo de dinero
              en la sesión de caja activa.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo de la anulación *
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Indica la razón de la anulación..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModal(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Regresar
              </button>
              <button
                onClick={handleCancelSale}
                disabled={cancelling || !cancelReason.trim()}
                className="px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {cancelling && <Loader2 size={14} className="animate-spin" />}
                Confirmar anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Invoices({ setPage, showDetail }: InvoicesProps) {
  const [sales, setSales] = useState<any[]>(demoInvoices);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await saleApi.list({ per_page: 50 });
      if (res.data && res.data.length > 0) {
        setSales(res.data);
      }
    } catch (e: any) {
      console.warn('Usando listado de facturas demo:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleViewDetail = async (inv: any) => {
    if (inv.id && typeof inv.id === 'number') {
      try {
        const full = await saleApi.get(inv.id);
        setSelectedInvoice(full.data);
        return;
      } catch (e) {
        // Fallback al objeto que tenemos
      }
    }
    setSelectedInvoice(inv);
  };

  if (selectedInvoice || showDetail) {
    const inv = selectedInvoice ?? sales[0];
    return (
      <InvoiceDetail
        invoice={inv}
        onBack={() => setSelectedInvoice(null)}
        onCancelSuccess={fetchSales}
      />
    );
  }

  const filtered = sales.filter((inv) => {
    const invNum = inv.invoice_number || inv.id || '';
    const custName = inv.customer?.name || inv.customer || '';
    const statusVal = inv.status || 'completed';

    const matchSearch =
      !search ||
      invNum.toLowerCase().includes(search.toLowerCase()) ||
      custName.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      !statusFilter ||
      statusVal === statusFilter ||
      (statusFilter === 'emitida' && statusVal === 'completed');

    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Facturación & Ventas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Historial y auditoría de comprobantes emitidos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSales}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => setPage('pos')}
            className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Nueva venta
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 shadow-xs">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número de factura o nombre de cliente..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-600 focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="completed">Emitida (Completada)</option>
          <option value="cancelled">Cancelada / Anulada</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  'Número',
                  'Cliente',
                  'Fecha',
                  'Items',
                  'Total',
                  'Método de pago',
                  'Estado',
                  'Acciones',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const invNumber = inv.invoice_number || inv.id;
                const custName = inv.customer?.name || inv.customer || 'Consumidor final';
                const dateStr = inv.created_at
                  ? new Date(inv.created_at).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : inv.date || '31/10/2026';
                const itemsCount = inv.items?.length ?? inv.items ?? 1;
                const totalVal = Number(inv.total);
                const payMethodName =
                  inv.payments?.[0]?.payment_method || inv.method || 'Efectivo';
                const statusVal = inv.status || 'completed';

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-slate-400" />
                        <span className="text-sm font-mono font-semibold text-slate-800">
                          {invNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-700">{custName}</td>
                    <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{dateStr}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</td>
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">{fmt(totalVal)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 capitalize">
                      {payMethodName}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          statusVal === 'completed' || statusVal === 'emitida'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                      >
                        {statusVal === 'completed' || statusVal === 'emitida'
                          ? 'Emitida'
                          : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleViewDetail(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye size={13} /> Ver factura
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    No se encontraron facturas registradas con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
