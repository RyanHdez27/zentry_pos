import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { auditLogs as demoAuditLogs } from '../data/demo';
import { useState, useEffect } from 'react';
import { auditApi, AuditLogItem } from '../services/api';

const moduleColors: Record<string, string> = {
  POS: 'bg-blue-50 text-blue-700 border-blue-200',
  Productos: 'bg-violet-50 text-violet-700 border-violet-200',
  Inventario: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Caja: 'bg-amber-50 text-amber-700 border-amber-200',
  Usuarios: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Audit() {
  const [logs, setLogs] = useState<any[]>(demoAuditLogs);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs();
      setLogs(res.data || []);
    } catch (e: any) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const modules = ['POS', 'Inventario', 'Caja', 'Usuarios'];

  const filtered = logs.filter((l) => {
    const userStr = l.user?.toLowerCase() || '';
    const actionStr = l.action?.toLowerCase() || '';
    const descStr = l.description?.toLowerCase() || '';
    const searchLower = search.toLowerCase();

    const matchSearch =
      !search ||
      userStr.includes(searchLower) ||
      actionStr.includes(searchLower) ||
      descStr.includes(searchLower);

    const matchModule = !moduleFilter || l.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Usuario,Accion,Modulo,Descripcion,Fecha']
        .concat(
          filtered.map(
            (l) =>
              `"${l.user}","${l.action}","${l.module}","${l.description}","${l.date || l.timestamp}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bitácora & Auditoría</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Registro de eventos críticos y trazabilidad transaccional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-xs font-semibold"
          >
            <Download size={15} /> Exportar CSV
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
            placeholder="Buscar por usuario, acción o comprobante..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-600 focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos los módulos</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Usuario', 'Acción', 'Módulo', 'Descripción', 'Fecha y hora'].map((h) => (
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
              {filtered.map((log, i) => {
                const colorClass = moduleColors[log.module] || 'bg-slate-100 text-slate-700 border-slate-200';
                return (
                  <tr key={log.id || i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{log.user}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-800 font-medium">{log.action}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${colorClass}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{log.description}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {log.date || (log.timestamp ? new Date(log.timestamp).toLocaleString() : '—')}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                    No se encontraron registros de auditoría con los filtros aplicados.
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
