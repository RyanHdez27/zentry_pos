import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { customerApi, type Customer } from '../services/api';
import { invoices } from '../data/demo';

function fmt(value: string | number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value || 0));
}

interface CustomersProps {
  setPage: (p: string) => void;
  showDetail?: boolean;
}

// ─── Modal para Crear / Editar Cliente ─────────────────────────────────────────

interface CustomerModalProps {
  customer?: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

function CustomerModal({ customer, onClose, onSaved }: CustomerModalProps) {
  const isEditing = Boolean(customer);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [form, setForm] = useState({
    document_type: customer?.document_type || 'CC',
    document_number: customer?.document_number || '',
    name: customer?.name || '',
    business_name: customer?.business_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    credit_limit: customer ? String(Number(customer.credit_limit) || 0) : '0',
    is_active: customer ? customer.is_active : true,
    notes: customer?.notes || '',
  });

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((p) => ({ ...p, [k]: val }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.document_number.trim()) {
      setApiError('El documento y el nombre son campos obligatorios.');
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const payload: Partial<Customer> = {
        document_type: form.document_type,
        document_number: form.document_number.trim(),
        name: form.name.trim(),
        business_name: form.business_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        credit_limit: form.credit_limit ? (form.credit_limit as any) : 0,
        is_active: form.is_active,
        notes: form.notes.trim() || null,
      };

      if (isEditing && customer) {
        await customerApi.update(customer.id, payload);
      } else {
        await customerApi.create(payload);
      }

      setSaved(true);
      onSaved();
    } catch (err: any) {
      const msgs = err?.errors ? Object.values(err.errors as Record<string, string[]>).flat() : [];
      setApiError(msgs.length ? msgs.join(' · ') : err?.message || 'Error al guardar el cliente.');
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
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {isEditing ? 'Cliente actualizado' : 'Cliente registrado'}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Los datos del cliente se guardaron exitosamente en el sistema.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Actualiza la información comercial y tributaria' : 'Ingresa los datos para facturación y POS'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {apiError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Documento y Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Doc.</label>
              <select
                value={form.document_type}
                onChange={f('document_type')}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="NIT">NIT (Empresas)</option>
                <option value="RUT">RUT</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="PP">Pasaporte</option>
                <option value="OTRO">Otro documento</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Número de Documento <span className="text-red-500">*</span>
              </label>
              <input
                value={form.document_number}
                onChange={f('document_number')}
                placeholder="Ej. 12345678 o 900.123.456-1"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Nombre y Razón Social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={f('name')}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Razón Social (Opcional)</label>
              <input
                value={form.business_name}
                onChange={f('business_name')}
                placeholder="Ej. Soluciones Digitales S.A.S."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contacto: Email y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={f('email')}
                placeholder="cliente@ejemplo.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono / WhatsApp</label>
              <input
                value={form.phone}
                onChange={f('phone')}
                placeholder="+57 300 000 0000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Ubicación: Dirección y Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección de Entrega / Fiscal</label>
              <input
                value={form.address}
                onChange={f('address')}
                placeholder="Cra. 43A #1-50 Of. 302"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ciudad</label>
              <input
                value={form.city}
                onChange={f('city')}
                placeholder="Medellín"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Línea de Crédito y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Límite de Crédito (COP)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  value={form.credit_limit}
                  onChange={f('credit_limit')}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Monto máximo para compras a crédito.</p>
            </div>
            <div className="flex flex-col justify-center">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Estado del Cliente</label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={f('is_active')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Cliente Activo (habilitado para ventas)</span>
              </label>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notas u Observaciones</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={f('notes')}
              placeholder="Preferencias de entrega, condiciones especiales de pago, etc."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Confirmar Eliminación ──────────────────────────────────────────────

function DeleteModal({
  customer,
  onClose,
  onDeleted,
}: {
  customer: Customer;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await customerApi.delete(customer.id);
      onDeleted();
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar el cliente.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">¿Eliminar cliente?</h3>
        <p className="text-sm text-slate-500 mb-4">
          ¿Estás seguro de eliminar a <strong className="text-slate-800">{customer.name}</strong>? Esta acción no borrará su historial de facturas previas.
        </p>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mb-4">{error}</p>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vista de Detalle de Cliente ──────────────────────────────────────────────

function CustomerDetail({
  customer,
  onBack,
  onEdit,
}: {
  customer: Customer;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState<'info' | 'compras' | 'credito'>('info');
  const customerInvoices = invoices.filter(
    (inv) => inv.customer.toLowerCase() === customer.name.toLowerCase()
  );

  const totalSpent = customerInvoices.reduce((acc, inv) => acc + inv.total, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={16} /> Volver a clientes
        </button>

        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
        >
          <Pencil size={13} /> Editar cliente
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-inner">
            {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
              {customer.business_name && (
                <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium flex items-center gap-1">
                  <Building size={12} /> {customer.business_name}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              {customer.document_type} {customer.document_number}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {customer.phone && (
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400" /> {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Mail size={14} className="text-slate-400" /> {customer.email}
                </span>
              )}
              {customer.city && (
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin size={14} className="text-slate-400" /> {customer.city}
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold ${
                customer.is_active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {customer.is_active ? (
                <>
                  <UserCheck size={13} /> Activo
                </>
              ) : (
                <>
                  <UserX size={13} /> Inactivo
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">
              {totalSpent > 0 ? fmt(totalSpent) : fmt(0)}
            </p>
            <p className="text-xs text-slate-500">Total Facturado</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
            <ShoppingCart size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{customerInvoices.length}</p>
            <p className="text-xs text-slate-500">Compras Realizadas</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">
              {fmt(customer.credit_limit || 0)}
            </p>
            <p className="text-xs text-slate-500">Límite de Crédito</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 px-5">
          {[
            { id: 'info', label: 'Información General' },
            { id: 'compras', label: `Historial de Facturación (${customerInvoices.length})` },
            { id: 'credito', label: 'Línea de Crédito & Saldo' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'info' && (
            <div className="grid md:grid-cols-2 gap-6">
              {[
                ['Nombre completo', customer.name],
                ['Razón social', customer.business_name || 'No especificada'],
                ['Tipo y número de documento', `${customer.document_type} ${customer.document_number}`],
                ['Teléfono', customer.phone || 'No registrado'],
                ['Correo electrónico', customer.email || 'No registrado'],
                ['Dirección fiscal / despacho', customer.address || 'No registrada'],
                ['Ciudad', customer.city || 'No registrada'],
                ['Estado en sistema', customer.is_active ? 'Activo' : 'Inactivo'],
                ['Notas', customer.notes || 'Sin observaciones'],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-slate-50 pb-3">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    {k}
                  </label>
                  <p className="text-sm font-medium text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'compras' && (
            <div>
              {customerInvoices.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Sin facturas emitidas</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cuando este cliente compre en el POS, sus comprobantes aparecerán aquí.
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {['Número', 'Fecha', 'Total', 'Método', 'Estado'].map((h) => (
                        <th
                          key={h}
                          className="pb-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-3.5 text-sm font-mono font-semibold text-slate-800">{inv.id}</td>
                        <td className="py-3.5 text-sm text-slate-600">{inv.date}</td>
                        <td className="py-3.5 text-sm font-bold text-slate-900">{fmt(inv.total)}</td>
                        <td className="py-3.5 text-sm text-slate-600">{inv.method}</td>
                        <td className="py-3.5">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              inv.status === 'emitida'
                                ? 'bg-emerald-50 text-emerald-700'
                                : inv.status === 'cancelada'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'credito' && (
            <div className="space-y-4 max-w-lg">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Límite Aprobado</span>
                  <span className="text-sm font-bold text-slate-800">{fmt(customer.credit_limit || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Saldo Deudor Actual</span>
                  <span className="text-sm font-bold text-amber-600">{fmt(customer.current_balance || 0)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="text-xs text-slate-700 font-bold uppercase">Cupo Disponible</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {fmt(Math.max(0, Number(customer.credit_limit || 0) - Number(customer.current_balance || 0)))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vista Principal de Clientes ──────────────────────────────────────────────

export default function Customers({ setPage, showDetail }: CustomersProps) {
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selected, setSelected] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Cargar clientes desde la API
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {
        page,
        per_page: 15,
      };
      if (search.trim()) filters.search = search.trim();
      if (activeFilter === 'active')   filters.active = true;
      if (activeFilter === 'inactive') filters.active = false;

      const res = await customerApi.list(filters);
      setCustomersList(res.data);
      if (res.meta) {
        setTotalPages(res.meta.last_page);
        setTotalCount(res.meta.total);
      }
    } catch {
      setCustomersList([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Si se selecciona un cliente para ver detalle
  if (selected || (showDetail && customersList.length > 0)) {
    const c = selected ?? customersList[0];
    return (
      <>
        <CustomerDetail
          customer={c}
          onBack={() => setSelected(null)}
          onEdit={() => setEditingCustomer(c)}
        />
        {editingCustomer && (
          <CustomerModal
            customer={editingCustomer}
            onClose={() => setEditingCustomer(null)}
            onSaved={() => {
              setEditingCustomer(null);
              fetchCustomers();
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalCount} {totalCount === 1 ? 'cliente registrado' : 'clientes registrados'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNum(1);
            }}
            placeholder="Buscar por nombre, documento, teléfono..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {(['all', 'active', 'inactive'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => {
                setActiveFilter(filterKey);
                setPageNum(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                activeFilter === filterKey
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filterKey === 'all' ? 'Todos' : filterKey === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={32} className="animate-spin mb-3 text-blue-600" />
            <p className="text-sm">Cargando catálogo de clientes...</p>
          </div>
        ) : customersList.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron clientes</h3>
            <p className="text-sm text-slate-500 mt-1">
              {search ? 'Intenta con otro término de búsqueda' : 'Registra tu primer cliente usando el botón superior.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {['Cliente / Empresa', 'Documento', 'Teléfono', 'Email', 'Límite Crédito', 'Estado', 'Acciones'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customersList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    {/* Cliente / Empresa */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold flex-shrink-0">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 hover:text-blue-600 cursor-pointer" onClick={() => setSelected(c)}>
                            {c.name}
                          </div>
                          {c.business_name && (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building size={11} /> {c.business_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Documento */}
                    <td className="px-5 py-4 text-sm font-mono text-slate-600 whitespace-nowrap">
                      <span className="text-xs text-slate-400 mr-1">{c.document_type}</span>
                      {c.document_number}
                    </td>

                    {/* Teléfono */}
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {c.phone || <span className="text-slate-300">—</span>}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {c.email || <span className="text-slate-300">—</span>}
                    </td>

                    {/* Límite de Crédito */}
                    <td className="px-5 py-4 text-sm font-medium text-slate-800 whitespace-nowrap">
                      {Number(c.credit_limit) > 0 ? fmt(c.credit_limit) : <span className="text-slate-400 text-xs">Sin crédito</span>}
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(c)}
                          title="Ver detalle"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setEditingCustomer(c)}
                          title="Editar"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingCustomer(c)}
                          title="Eliminar"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && customersList.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {customersList.length} de {totalCount} clientes
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPageNum((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-blue-50 text-blue-700">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CustomerModal
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false);
            fetchCustomers();
          }}
        />
      )}

      {editingCustomer && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={() => {
            setEditingCustomer(null);
            fetchCustomers();
          }}
        />
      )}

      {deletingCustomer && (
        <DeleteModal
          customer={deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          onDeleted={() => {
            setDeletingCustomer(null);
            fetchCustomers();
          }}
        />
      )}
    </div>
  );
}
