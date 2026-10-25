import { Search, Filter, Download } from 'lucide-react';
import { auditLogs } from '../data/demo';
import { useState } from 'react';

const moduleColors: Record<string, string> = {
  POS: 'bg-blue-50 text-blue-700',
  Productos: 'bg-violet-50 text-violet-700',
  Inventario: 'bg-emerald-50 text-emerald-700',
  Caja: 'bg-amber-50 text-amber-700',
  Usuarios: 'bg-slate-100 text-slate-600',
};

export default function Audit() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const modules = [...new Set(auditLogs.map((l) => l.module))];
  const filtered = auditLogs.filter((l) => {
    const matchSearch = !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase());
    const matchModule = !moduleFilter || l.module === moduleFilter;
    return matchSearch && matchModule;
  });

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Auditoría</h1>
          <p className="text-sm text-slate-500 mt-0.5">Registro completo de actividad del sistema</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
          <Download size={15} /> Exportar log
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuario o acción..." className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        </div>
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600 focus:outline-none focus:border-blue-500">
          <option value="">Todos los módulos</option>
          {modules.map((m) => <option key={m}>{m}</option>)}
        </select>
        <input type="date" className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-600 focus:outline-none focus:border-blue-500" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Usuario', 'Acción', 'Módulo', 'Descripción', 'Fecha y hora'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {log.avatar}
                      </div>
                      <span className="text-sm font-medium text-slate-800 whitespace-nowrap">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">{log.action}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${moduleColors[log.module] ?? 'bg-slate-100 text-slate-600'}`}>
                      {log.module}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 max-w-xs truncate">{log.description}</td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-slate-700 whitespace-nowrap">{log.date}</p>
                      <p className="text-xs text-slate-400">{log.time}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">Mostrando {filtered.length} de {auditLogs.length} registros</p>
        </div>
      </div>
    </div>
  );
}
