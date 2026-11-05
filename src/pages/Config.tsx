import { useState, useEffect } from 'react';
import { Building2, Globe, Receipt, Save, CheckCircle, Loader2 } from 'lucide-react';
import { assetUrl, companyApi, Company, tokenStorage } from '../services/api';

const tabs = [
  { id: 'company', label: 'Empresa & Datos Fiscales', icon: Building2 },
  { id: 'regional', label: 'Moneda & Consecutivos', icon: Globe },
  { id: 'taxes', label: 'Impuestos & Tasas', icon: Receipt },
];

export default function Config() {
  const [tab, setTab] = useState('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const currentUser = tokenStorage.getUser();
  const isAdmin = currentUser?.role === 'admin';

  const [form, setForm] = useState({
    name: '',
    legal_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    currency: 'COP',
    default_tax_rate: 19,
    invoice_prefix: 'FV-',
  });

  useEffect(() => {
    async function loadCompany() {
      setLoading(true);
      try {
        const res = await companyApi.get();
        if (res.data) {
          const c = res.data;
          setForm({
            name: c.name || '',
            legal_name: (c as any).legal_name || '',
            tax_id: c.tax_id || '',
            email: (c as any).email || '',
            phone: (c as any).phone || '',
            address: (c as any).address || '',
            currency: c.currency || 'COP',
            default_tax_rate: Number(c.default_tax_rate) || 19,
            invoice_prefix: c.invoice_prefix || 'FV-',
          });
        }
      } catch (e: any) {
        console.warn('Usando configuración local:', e.message);
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, []);

  const handleSave = async () => {
    if (!isAdmin) {
      alert('Solo los administradores pueden modificar la configuración de la empresa.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.set(key, String(value)));
      if (logo) data.set('logo', logo);
      const res = await companyApi.update(data);

      if (res.data) {
        tokenStorage.setCompany(res.data);
        window.dispatchEvent(new Event('zentry:session-updated'));
      }
      setLogo(null);
      setLogoPreview(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Error al guardar los ajustes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1000px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configuración del Negocio</h1>
          <p className="text-sm text-slate-500 mt-0.5">Parámetros comerciales, fiscales y consecutivos</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar cambios
          </button>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium animate-in fade-in">
          <CheckCircle size={18} className="text-emerald-500" />
          La configuración comercial ha sido actualizada y persistida correctamente.
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-5">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all -mb-px ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Tab Empresa */}
          {tab === 'company' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-xs text-slate-400">
                  {(logoPreview || assetUrl((tokenStorage.getCompany() as any)?.logo_path)) ? <img src={logoPreview || assetUrl((tokenStorage.getCompany() as any)?.logo_path)} alt="Logo de empresa" className="h-full w-full object-contain" /> : 'Logo'}
                </div>
                <div><label className="cursor-pointer text-sm font-semibold text-blue-700">Cargar logo empresarial<input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setLogo(file); setLogoPreview(URL.createObjectURL(file)); } }} /></label><p className="mt-1 text-xs text-slate-500">JPG, PNG o WebP, máximo 3 MB.</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nombre comercial *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={form.legal_name}
                    onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIT / Identificación fiscal
                  </label>
                  <input
                    type="text"
                    value={form.tax_id}
                    onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Teléfono comercial
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Dirección física
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Regional & Consecutivos */}
          {tab === 'regional' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Moneda principal *
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white font-medium"
                  >
                    <option value="COP">COP — Peso Colombiano ($)</option>
                    <option value="USD">USD — Dólar Estadounidense ($)</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="MXN">MXN — Peso Mexicano ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Prefijo oficial de facturación *
                  </label>
                  <input
                    type="text"
                    value={form.invoice_prefix}
                    onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                    placeholder="FV-"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Ejemplo de consecutivo generado: <strong>{form.invoice_prefix}000153</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Impuestos */}
          {tab === 'taxes' && (
            <div className="space-y-4">
              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tasa de impuesto general por defecto (%) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.default_tax_rate}
                    onChange={(e) => setForm({ ...form, default_tax_rate: Number(e.target.value) })}
                    className="w-32 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold"
                  />
                  <span className="text-sm text-slate-600">% IVA</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Esta tasa se aplicará automáticamente a los productos que no tengan una tasa de impuesto personalizada.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
