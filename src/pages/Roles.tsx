import { useState } from 'react';
import { Shield, Check } from 'lucide-react';

const modules = ['Ventas', 'POS', 'Productos', 'Inventario', 'Clientes', 'Caja', 'Facturación', 'Reportes', 'Usuarios', 'Roles', 'Auditoría', 'Configuración'];

const rolesData = [
  {
    id: 'admin',
    name: 'Administrador',
    desc: 'Acceso completo al sistema',
    color: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    permissions: modules.reduce((a, m) => ({ ...a, [m]: true }), {} as Record<string, boolean>),
  },
  {
    id: 'cashier',
    name: 'Cajero',
    desc: 'Ventas, caja y consulta de clientes',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    permissions: {
      Ventas: true, POS: true, Productos: true, Inventario: false,
      Clientes: true, Caja: true, Facturación: true, Reportes: false,
      Usuarios: false, Roles: false, Auditoría: false, Configuración: false,
    },
  },
  {
    id: 'inventory',
    name: 'Inventario',
    desc: 'Gestión de productos e inventario',
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    permissions: {
      Ventas: false, POS: false, Productos: true, Inventario: true,
      Clientes: false, Caja: false, Facturación: false, Reportes: true,
      Usuarios: false, Roles: false, Auditoría: false, Configuración: false,
    },
  },
];

export default function Roles() {
  const [roles, setRoles] = useState(rolesData);
  const [activeRole, setActiveRole] = useState('admin');
  const [saved, setSaved] = useState(false);

  const role = roles.find((r) => r.id === activeRole)!;

  const togglePerm = (module: string) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === activeRole
          ? { ...r, permissions: { ...r.permissions, [module]: !r.permissions[module] } }
          : r
      )
    );
    setSaved(false);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Roles y permisos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Define qué puede hacer cada rol en el sistema</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Role list */}
        <div className="lg:col-span-1 space-y-2">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRole(r.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                activeRole === r.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${r.color}`}>
                <Shield size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                <p className="text-xs text-slate-500">{Object.values(r.permissions).filter(Boolean).length} permisos</p>
              </div>
            </button>
          ))}
        </div>

        {/* Permissions */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${role.dot}`}></span>
                <h2 className="text-base font-bold text-slate-900">{role.name}</h2>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{role.desc}</p>
            </div>
            <button
              onClick={() => setSaved(true)}
              className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all ${saved ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {saved ? '✓ Guardado' : 'Guardar cambios'}
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {modules.map((module) => {
                const enabled = role.permissions[module];
                return (
                  <button
                    key={module}
                    onClick={() => togglePerm(module)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      enabled ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      enabled ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                    }`}>
                      {enabled && <Check size={12} className="text-white" />}
                    </div>
                    <span className={`text-sm font-medium ${enabled ? 'text-blue-800' : 'text-slate-500'}`}>{module}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
