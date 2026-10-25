import { useState } from 'react';
import { Plus, Eye, Pencil, Trash2, UserCog, X, CheckCircle } from 'lucide-react';
import { users } from '../data/demo';

function NewUserModal({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Cajero', status: 'active' });
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Usuario creado</h3>
          <p className="text-sm text-slate-500 mb-6">Se envió el correo de bienvenida con las credenciales.</p>
          <button onClick={onClose} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Continuar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Nuevo usuario</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre completo *</label>
            <input value={form.name} onChange={f('name')} placeholder="Nombre y apellido" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Correo electrónico *</label>
            <input value={form.email} onChange={f('email')} type="email" placeholder="correo@empresa.com" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Rol</label>
            <select value={form.role} onChange={f('role')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
              {['Administrador', 'Cajero', 'Inventario'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            Se generará una contraseña temporal y se enviará al correo ingresado.
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
          <button onClick={() => setSaved(true)} className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Crear usuario</button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [showModal, setShowModal] = useState(false);

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      'Administrador': 'bg-violet-50 text-violet-700',
      'Cajero': 'bg-blue-50 text-blue-700',
      'Inventario': 'bg-emerald-50 text-emerald-700',
    };
    return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[role] ?? 'bg-slate-100 text-slate-600'}`}>{role}</span>;
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {showModal && <NewUserModal onClose={() => setShowModal(false)} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Usuario', 'Email', 'Rol', 'Estado', 'Último acceso', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.avatar}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{u.email}</td>
                  <td className="px-5 py-4">{roleBadge(u.role)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{u.lastAccess}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={15} /></button>
                      <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
