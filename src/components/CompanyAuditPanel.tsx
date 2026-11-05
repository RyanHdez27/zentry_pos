import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { superAdminApi, type ManagedCompany } from '../services/api';

export default function CompanyAuditPanel({ company }: { company: ManagedCompany }) {
  const [rows, setRows] = useState<Array<{id:string;user:string;action:string;detail:string;created_at:string}>>([]);
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [error, setError] = useState('');
  const load = () => superAdminApi.audit(company.id, { date_from: from || undefined, date_to: to || undefined }).then(r => setRows(r.data)).catch(e => setError(e.message || 'No se pudo cargar la auditoría.'));
  useEffect(() => { void load(); }, [company.id, from, to]);
  return <section className="rounded-lg border border-slate-200 bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Auditoría · {company.name}</h3><div className="flex items-center gap-2 text-xs"><label>Desde <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="rounded border px-1.5 py-1"/></label><label>Hasta <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded border px-1.5 py-1"/></label><button onClick={load} className="rounded p-1.5 hover:bg-slate-100" title="Actualizar"><RefreshCw size={14}/></button></div></div>{error && <p className="mt-2 text-xs text-red-600">{error}</p>}<div className="mt-3 max-h-64 divide-y overflow-y-auto">{rows.map(row=><div key={row.id} className="grid gap-1 py-2 text-xs sm:grid-cols-[145px_1fr_1.3fr]"><span className="text-slate-400">{new Date(row.created_at).toLocaleString('es-CO')}</span><span><b>{row.user || 'Cuenta eliminada'}</b> · {row.action}</span><span className="text-slate-600">{row.detail}</span></div>)}{rows.length===0 && !error && <p className="py-5 text-center text-xs text-slate-400">No hay actividad en el rango seleccionado.</p>}</div></section>;
}
