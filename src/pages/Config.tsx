import { useState } from 'react';
import { Building2, Globe, Receipt, Save, CheckCircle, Upload } from 'lucide-react';

const tabs = [
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'regional', label: 'Regional', icon: Globe },
  { id: 'taxes', label: 'Impuestos', icon: Receipt },
];

export default function Config() {
  const [tab, setTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [company, setCompany] = useState({
    name: 'Empresa Demo',
    razonSocial: 'Empresa Demo S.A.S.',
    nit: '900.123.456-7',
    phone: '(601) 234-5678',
    email: 'info@empresademo.com',
    address: 'Calle 72 # 10-34',
    city: 'Bogotá',
  });
  const [regional, setRegional] = useState({ currency: 'COP', timezone: 'America/Bogota', dateFormat: 'DD/MM/YYYY' });
  const [taxes, setTaxes] = useState([
    { id: 1, name: 'IVA General', rate: 19, active: true },
    { id: 2, name: 'IVA Reducido', rate: 5, active: true },
    { id: 3, name: 'Exento', rate: 0, active: true },
  ]);

  const cf = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setCompany((p) => ({ ...p, [k]: e.target.value }));
  const rf = (k: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setRegional((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="p-6 space-y-5 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Ajusta los parámetros del sistema</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-5">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {tab === 'company' && (
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Logo de la empresa</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-900 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">Z</span>
                    </div>
                  </div>
                  <div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                      <Upload size={14} /> Cambiar logo
                    </button>
                    <p className="text-xs text-slate-400 mt-1">PNG, SVG hasta 1MB. Recomendado: 512×512</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {[
                  ['name', 'Nombre comercial', company.name],
                  ['razonSocial', 'Razón social', company.razonSocial],
                  ['nit', 'NIT', company.nit],
                  ['phone', 'Teléfono', company.phone],
                  ['email', 'Email', company.email],
                  ['address', 'Dirección', company.address],
                  ['city', 'Ciudad', company.city],
                ].map(([k, l, v]) => (
                  <div key={k} className={k === 'razonSocial' || k === 'address' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">{l}</label>
                    <input value={v} onChange={cf(k)} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'regional' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Moneda</label>
                <select value={regional.currency} onChange={rf('currency')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="COP">COP — Peso colombiano</option>
                  <option value="USD">USD — Dólar americano</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Zona horaria</label>
                <select value={regional.timezone} onChange={rf('timezone')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="America/Bogota">América/Bogotá (UTC-5)</option>
                  <option value="America/Mexico_City">América/Ciudad de México (UTC-6)</option>
                  <option value="America/Lima">América/Lima (UTC-5)</option>
                  <option value="America/Buenos_Aires">América/Buenos Aires (UTC-3)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Formato de fecha</label>
                <select value={regional.dateFormat} onChange={rf('dateFormat')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'taxes' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Configura las tarifas de impuestos aplicables a tus productos.</p>
              <div className="space-y-2">
                {taxes.map((tax) => (
                  <div key={tax.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTaxes((p) => p.map((t) => t.id === tax.id ? { ...t, active: !t.active } : t))}
                        className={`w-10 h-6 rounded-full transition-all flex-shrink-0 ${tax.active ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-all ${tax.active ? 'translate-x-4' : ''}`}></div>
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{tax.name}</p>
                        <p className="text-xs text-slate-500">{tax.rate > 0 ? `${tax.rate}% sobre el precio de venta` : 'Sin impuesto'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tax.rate}
                        onChange={(e) => setTaxes((p) => p.map((t) => t.id === tax.id ? { ...t, rate: Number(e.target.value) } : t))}
                        className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-center font-semibold focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-sm text-slate-500">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm border border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-blue-400 hover:text-blue-600 w-full justify-center transition-colors">
                + Agregar impuesto
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle size={15} /> Cambios guardados
            </span>
          )}
          <button
            onClick={() => setSaved(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Save size={15} /> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
