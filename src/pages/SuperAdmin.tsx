import { useCallback, useEffect, useState } from 'react';
import { Activity, Building2, Check, ChevronDown, ChevronUp, Pencil, Plus, RefreshCw, ShieldCheck, ShoppingBag, Trash2, Users, X } from 'lucide-react';
import { superAdminApi, type ManagedCompany, type ManagedUser, type SuperAdminDashboard } from '../services/api';
import CompanyAuditPanel from '../components/CompanyAuditPanel';

const modules = [
  ['dashboard', 'Dashboard'], ['pos', 'Punto de venta'], ['products', 'Productos'], ['inventory', 'Inventario'],
  ['customers', 'Clientes'], ['cash', 'Caja'], ['invoices', 'Facturas'], ['reports', 'Reportes'],
  ['users', 'Usuarios'], ['roles', 'Roles'], ['settings', 'Configuración'], ['audit', 'Auditoría'],
] as const;
const blankCompany = { name: '', legal_name: '', tax_id: '', email: '', phone: '', address: '', currency: 'COP', default_tax_rate: 19, invoice_prefix: 'FV-' };
const blankUser = { name: '', email: '', password: '', role: 'cashier', status: 'active', phone: '' };
const money = (n: number) => '$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });

export default function SuperAdmin() {
  const [dashboard, setDashboard] = useState<SuperAdminDashboard | null>(null);
  const [companyForm, setCompanyForm] = useState(blankCompany);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [companyEdit, setCompanyEdit] = useState<ManagedCompany | null>(null);
  const [selected, setSelected] = useState<ManagedCompany | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [userForm, setUserForm] = useState(blankUser);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userModal, setUserModal] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [auditCompanyId, setAuditCompanyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await superAdminApi.dashboard();
    setDashboard(res.data);
    if (selected) {
      const refreshed = res.data.companies.find(c => c.id === selected.id) || null;
      setSelected(refreshed);
    }
  }, [selected?.id]);

  useEffect(() => { load().catch(() => setError('No se pudo conectar con la API de administración.')); }, [load]);
  const refreshUsers = async (company: ManagedCompany) => setUsers((await superAdminApi.users(company.id)).data);
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await superAdminApi.createCompany({ ...companyForm, default_tax_rate: Number(companyForm.default_tax_rate), modules: modules.map(([id]) => id), admin: adminForm });
      setCompanyForm(blankCompany); setAdminForm({ name: '', email: '', password: '' });
      setNotice('Empresa y administrador creados.'); await load();
    } catch (e: any) { setError(e.message || 'No se pudo crear la empresa.'); }
    finally { setBusy(false); }
  };
  const saveCompany = async (company: ManagedCompany, patch: Record<string, unknown>) => {
    setBusy(true); setError('');
    try { await superAdminApi.updateCompany(company.id, patch); setNotice('Cambios de empresa guardados.'); await load(); }
    catch (e: any) { setError(e.message || 'No se pudieron guardar los cambios.'); }
    finally { setBusy(false); }
  };
  const toggleModule = async (company: ManagedCompany, module: string) => {
    const current = company.modules || [];
    const next = current.includes(module) ? current.filter(m => m !== module) : [...current, module];
    await saveCompany(company, { modules: next });
  };
  const chooseCompany = async (company: ManagedCompany) => {
    setSelected(company); setExpanded(expanded === company.id ? null : company.id); setError('');
    try { await refreshUsers(company); } catch (e: any) { setError(e.message || 'No se pudieron cargar los usuarios.'); }
  };
  const deleteCompany = async (company: ManagedCompany) => {
    if (!window.confirm(`Eliminar ${company.name} y todos sus datos, productos, ventas y usuarios? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try { await superAdminApi.deleteCompany(company.id); if (selected?.id === company.id) { setSelected(null); setUsers([]); } setNotice('Empresa y datos eliminados.'); await load(); }
    catch (e: any) { setError(e.message || 'No se pudo eliminar la empresa.'); }
    finally { setBusy(false); }
  };
  const openNewUser = () => { setEditingUser(null); setUserForm(blankUser); setUserModal(true); };
  const openEditUser = (user: ManagedUser) => { setEditingUser(user); setUserForm({ name: user.name, email: user.email, password: '', role: user.role, status: user.status, phone: user.phone || '' }); setUserModal(true); };
  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setBusy(true); setError('');
    const data: Record<string, unknown> = { ...userForm };
    if (!data.password) delete data.password;
    try {
      if (editingUser) await superAdminApi.updateUser(selected.id, editingUser.id, data);
      else await superAdminApi.createUser(selected.id, data);
      setUserModal(false); setNotice(editingUser ? 'Usuario actualizado.' : 'Usuario creado.'); await refreshUsers(selected); await load();
    } catch (e: any) { setError(e.message || 'No se pudo guardar el usuario.'); }
    finally { setBusy(false); }
  };
  const deleteUser = async (user: ManagedUser) => {
    if (!selected || !window.confirm(`Eliminar el usuario ${user.name}?`)) return;
    try { await superAdminApi.deleteUser(selected.id, user.id); setNotice('Usuario eliminado.'); await refreshUsers(selected); await load(); }
    catch (e: any) { setError(e.message || 'No se pudo eliminar el usuario.'); }
  };
  const toggleUserStatus = async (user: ManagedUser) => {
    if (!selected) return;
    try { await superAdminApi.updateUser(selected.id, user.id, { status: user.status === 'active' ? 'inactive' : 'active' }); setNotice(user.status === 'active' ? 'Usuario bloqueado.' : 'Usuario reactivado.'); await refreshUsers(selected); }
    catch (e: any) { setError(e.message || 'No se pudo cambiar el estado del usuario.'); }
  };

  const field = (label: string, value: string | number, onChange: (v: string) => void, props: { type?: string; required?: boolean; minLength?: number } = {}) => (
    <label className="block text-sm text-slate-600">{label}<input type={props.type || 'text'} required={props.required} minLength={props.minLength} value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
  );

  const stats = dashboard?.summary;
  return <div className="p-5 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Consola global</p><h1 className="text-2xl font-bold text-slate-900">Empresas y uso</h1><p className="mt-1 text-sm text-slate-500">Administra tenants, módulos y usuarios desde un solo lugar.</p></div><button onClick={() => load().catch(() => setError('No se pudieron actualizar las métricas.'))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><RefreshCw size={15}/> Actualizar</button></header>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button onClick={() => setError('')} className="float-right"><X size={16}/></button></div>}
    {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}<button onClick={() => setNotice('')} className="float-right"><X size={16}/></button></div>}
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {[
        { label: 'Empresas activas', value: `${stats?.active_companies ?? 0} / ${stats?.companies ?? 0}`, icon: Building2, color: 'text-blue-600 bg-blue-50' },
        { label: 'Usuarios', value: stats?.users ?? 0, icon: Users, color: 'text-violet-600 bg-violet-50' },
        { label: 'Productos', value: stats?.products ?? 0, icon: ShoppingBag, color: 'text-amber-600 bg-amber-50' },
        { label: 'Ventas', value: stats?.sales ?? 0, icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Ingresos registrados', value: money(stats?.revenue ?? 0), icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50' },
      ].map(card => <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}><card.icon size={18}/></div><p className="text-xs text-slate-500">{card.label}</p><p className="mt-1 text-xl font-bold text-slate-900">{card.value}</p></div>)}
    </section>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden"><div className="border-b border-slate-200 p-5"><h2 className="font-semibold text-slate-900">Empresas ({dashboard?.companies.length ?? 0})</h2><p className="mt-1 text-xs text-slate-500">Uso agregado y acceso a los módulos habilitados.</p></div>
        <div className="divide-y divide-slate-100">{dashboard?.companies.map(company => <article key={company.id}>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4"><button onClick={() => chooseCompany(company)} className="min-w-48 text-left"><span className="flex items-center gap-2 font-semibold text-slate-800">{company.name}{expanded === company.id ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}</span><span className="text-xs text-slate-500">{company.tax_id || 'Sin NIT'} · {company.currency} · {company.status === 'active' ? 'Activa' : 'Suspendida'}</span></button>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500"><span>{company.users_count ?? 0} usuarios</span><span>{company.products_count ?? 0} productos</span><span>{company.sales_count ?? 0} ventas</span><strong className="text-slate-700">{money(company.sales_total ?? 0)}</strong></div>
            <div className="flex items-center gap-1"><button onClick={() => setCompanyEdit(company)} title="Editar empresa" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={15}/></button><button onClick={() => saveCompany(company, { status: company.status === 'active' ? 'suspended' : 'active' })} title={company.status === 'active' ? 'Suspender' : 'Activar'} className="rounded-lg px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">{company.status === 'active' ? 'Suspender' : 'Activar'}</button><button disabled={busy} onClick={() => deleteCompany(company)} title="Eliminar empresa" className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={15}/></button></div>
          </div>
          {expanded === company.id && <div className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-4"><div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-700">Módulos habilitados</h3><span className="text-xs text-slate-500">Los cambios se aplican también en la API.</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{modules.map(([id, label]) => <label key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"><input type="checkbox" checked={(company.modules || []).includes(id)} disabled={busy} onChange={() => toggleModule(company, id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>{label}</label>)}</div></div>
            <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-700">Usuarios de {company.name}</h3><button onClick={openNewUser} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"><Plus size={13}/> Agregar usuario</button></div><div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">{(selected?.id === company.id ? users : []).map(user => <div key={user.id} className="flex items-center justify-between gap-2 px-3 py-2.5"><div><p className="text-sm font-medium text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.email} · {user.role === 'cashier' ? 'Vendedor' : user.role === 'inventory' ? 'Inventario' : 'Administrador'} · {user.status === 'inactive' ? 'Bloqueado' : 'Activo'}</p></div><div className="flex gap-1"><button onClick={() => toggleUserStatus(user)} className={`rounded px-2 py-1 text-xs ${user.status === 'active' ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>{user.status === 'active' ? 'Bloquear' : 'Reactivar'}</button><button onClick={() => openEditUser(user)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><Pencil size={14}/></button><button onClick={() => deleteUser(user)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14}/></button></div></div>)}{selected?.id !== company.id && <div className="p-3 text-xs text-slate-500">Abre la empresa para cargar sus usuarios.</div>}{selected?.id === company.id && users.length === 0 && <div className="p-3 text-xs text-slate-500">No hay usuarios en esta empresa.</div>}</div></div>
            <button onClick={() => { setAuditCompanyId(auditCompanyId === company.id ? null : company.id); if(selected?.id !== company.id) void chooseCompany(company); }} className="text-sm font-semibold text-blue-700 hover:underline">{auditCompanyId === company.id ? 'Ocultar auditoría' : 'Ver auditoría de empresa'}</button>
            {auditCompanyId === company.id && <CompanyAuditPanel company={company}/>}
          </div>}
        </article>)}{dashboard?.companies.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Aún no hay empresas. Puedes crear la primera desde el formulario.</p>}</div>
      </div>

      <form onSubmit={handleCreateCompany} className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5"><div><h2 className="font-semibold text-slate-900">Crear empresa</h2><p className="mt-1 text-xs text-slate-500">Se crea también su administrador inicial.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{field('Nombre comercial', companyForm.name, v => setCompanyForm({ ...companyForm, name: v }), { required: true })}{field('Razón social', companyForm.legal_name, v => setCompanyForm({ ...companyForm, legal_name: v }))}{field('NIT / identificación', companyForm.tax_id, v => setCompanyForm({ ...companyForm, tax_id: v }))}{field('Correo de empresa', companyForm.email, v => setCompanyForm({ ...companyForm, email: v }), { type: 'email' })}{field('Moneda', companyForm.currency, v => setCompanyForm({ ...companyForm, currency: v }), { required: true })}{field('Impuesto (%)', companyForm.default_tax_rate, v => setCompanyForm({ ...companyForm, default_tax_rate: Number(v) }), { type: 'number', required: true })}{field('Prefijo de factura', companyForm.invoice_prefix, v => setCompanyForm({ ...companyForm, invoice_prefix: v }), { required: true })}</div><div className="border-t border-slate-100 pt-3"><h3 className="mb-3 text-sm font-semibold text-slate-800">Administrador inicial</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{field('Nombre', adminForm.name, v => setAdminForm({ ...adminForm, name: v }), { required: true })}{field('Correo de acceso', adminForm.email, v => setAdminForm({ ...adminForm, email: v }), { type: 'email', required: true })}{field('Contraseña inicial', adminForm.password, v => setAdminForm({ ...adminForm, password: v }), { type: 'password', minLength: 10, required: true })}</div></div><button disabled={busy} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? 'Guardando…' : 'Crear empresa y administrador'}</button></form>
    </section>

    {companyEdit && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={e => { e.preventDefault(); void saveCompany(companyEdit, { name: companyEdit.name, legal_name: companyEdit.legal_name, tax_id: companyEdit.tax_id, email: companyEdit.email, phone: (companyEdit as any).phone, address: (companyEdit as any).address, currency: companyEdit.currency, default_tax_rate: Number(companyEdit.default_tax_rate), invoice_prefix: companyEdit.invoice_prefix }).then(() => setCompanyEdit(null)); }} className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between"><div><h2 className="text-lg font-bold">Editar empresa</h2><p className="text-xs text-slate-500">{companyEdit.name}</p></div><button type="button" onClick={() => setCompanyEdit(null)}><X size={18}/></button></div><div className="grid gap-3 sm:grid-cols-2">{field('Nombre comercial', companyEdit.name, v => setCompanyEdit({ ...companyEdit, name: v }), { required: true })}{field('Razón social', companyEdit.legal_name || '', v => setCompanyEdit({ ...companyEdit, legal_name: v }))}{field('NIT', companyEdit.tax_id || '', v => setCompanyEdit({ ...companyEdit, tax_id: v }))}{field('Correo', companyEdit.email || '', v => setCompanyEdit({ ...companyEdit, email: v }), { type: 'email' })}{field('Teléfono', (companyEdit as any).phone || '', v => setCompanyEdit({ ...companyEdit, phone: v } as ManagedCompany))}{field('Dirección', (companyEdit as any).address || '', v => setCompanyEdit({ ...companyEdit, address: v } as ManagedCompany))}{field('Moneda', companyEdit.currency, v => setCompanyEdit({ ...companyEdit, currency: v }), { required: true })}{field('Impuesto (%)', companyEdit.default_tax_rate, v => setCompanyEdit({ ...companyEdit, default_tax_rate: Number(v) }), { type: 'number', required: true })}{field('Prefijo', companyEdit.invoice_prefix, v => setCompanyEdit({ ...companyEdit, invoice_prefix: v }), { required: true })}</div><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Guardar cambios</button></form></div>}
    {userModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={saveUser} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between"><div><h2 className="text-lg font-bold">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h2><p className="text-xs text-slate-500">Empresa: {selected?.name}</p></div><button type="button" onClick={() => setUserModal(false)}><X size={18}/></button></div>{field('Nombre', userForm.name, v => setUserForm({ ...userForm, name: v }), { required: true })}{field('Correo', userForm.email, v => setUserForm({ ...userForm, email: v }), { type: 'email', required: true })}{field(editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña (mínimo 10 caracteres)', userForm.password, v => setUserForm({ ...userForm, password: v }), { type: 'password', required: !editingUser, minLength: 10 })}<div className="grid grid-cols-2 gap-3"><label className="text-sm text-slate-600">Rol<select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="admin">Administrador</option><option value="cashier">Vendedor / Cajero</option><option value="inventory">Inventario</option></select></label><label className="text-sm text-slate-600">Estado<select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="active">Activo</option><option value="inactive">Inactivo</option></select></label></div>{field('Teléfono', userForm.phone, v => setUserForm({ ...userForm, phone: v }))}<div className="flex justify-end gap-2"><button type="button" onClick={() => setUserModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancelar</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"><Check size={15}/>{busy ? 'Guardando…' : 'Guardar usuario'}</button></div></form></div>}
  </div>;
}
