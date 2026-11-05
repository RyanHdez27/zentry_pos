import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, Users, DollarSign,
  FileText, BarChart2, UserCog, Shield, ClipboardList, Settings,
  Bell, Search, ChevronDown, Menu, LogOut, User, Plus, ChevronRight, Building2
} from 'lucide-react';
import { assetUrl, authApi, tokenStorage, type User as ApiUser, type Company } from '../services/api';

type Page =
  | 'dashboard' | 'pos' | 'sales' | 'products' | 'product-new' | 'product-detail'
  | 'inventory' | 'inventory-movements' | 'customers' | 'customer-detail'
  | 'cash' | 'invoices' | 'invoice-detail' | 'reports'
  | 'users' | 'roles' | 'config' | 'audit' | 'superadmin' | 'profile';

interface LayoutProps {
  page: Page;
  setPage: (p: Page) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

const navGroups = [
  {
    label: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'pos', label: 'Nueva venta', icon: Plus, highlight: true },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { id: 'sales', label: 'Ventas', icon: ShoppingCart },
      { id: 'products', label: 'Productos', icon: Package },
      { id: 'inventory', label: 'Inventario', icon: Warehouse },
      { id: 'customers', label: 'Clientes', icon: Users },
      { id: 'cash', label: 'Caja', icon: DollarSign },
      { id: 'invoices', label: 'Facturas', icon: FileText },
      { id: 'reports', label: 'Reportes', icon: BarChart2 },
    ],
  },
  {
    label: 'Administración',
    items: [
      { id: 'users', label: 'Usuarios', icon: UserCog },
      { id: 'roles', label: 'Roles y permisos', icon: Shield },
      { id: 'audit', label: 'Auditoría', icon: ClipboardList },
    ],
  },
];

function UserMenu({ role, onAction, onLogout, above = false }: { role?: ApiUser['role']; onAction: (page: Page) => void; onLogout: () => void; above?: boolean }) {
  return <div className={`absolute ${above ? 'bottom-full left-3 mb-2' : 'right-0 top-full mt-1'} w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50`}>
    <button onClick={() => onAction('profile')} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><User size={15} className="text-slate-400" />Mi perfil</button>
    {role === 'admin' && <button onClick={() => onAction('config')} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Settings size={15} className="text-slate-400" />Configuración del negocio</button>}
    <div className="my-1 border-t border-slate-100" />
    <button onClick={onLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"><LogOut size={15} />Cerrar sesión</button>
  </div>;
}

// Usuario demo por defecto para el modo sin backend
export default function Layout({ page, setPage, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuLocation, setUserMenuLocation] = useState<'sidebar' | 'navbar' | null>(null);

  // App valida la sesión una sola vez; el layout solo refleja la sesión guardada.
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(() => tokenStorage.getUser());
  const [currentCompany, setCurrentCompany] = useState<Company | null>(() => tokenStorage.getCompany());

  useEffect(() => {
    const refreshSession = () => { setCurrentUser(tokenStorage.getUser()); setCurrentCompany(tokenStorage.getCompany()); };
    window.addEventListener('zentry:session-updated', refreshSession);
    return () => window.removeEventListener('zentry:session-updated', refreshSession);
  }, []);

  const handleLogout = async () => {
    setUserMenuLocation(null);
    try {
      await authApi.logout();
    } catch {
      tokenStorage.clear();
    }
    if (onLogout) {
      onLogout();
    }
  };

  // Si no hay usuario (modo demo sin datos), usar el usuario demo genérico
  const user = currentUser;
  const company = currentCompany;

  const userName = user?.name ?? '';
  const userRole = user?.role === 'superadmin' ? 'Superadministrador' : user?.role === 'admin' ? 'Administrador' : user?.role === 'inventory' ? 'Inventario' : 'Cajero';
  const userInitials = user?.avatar || userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const avatarUrl = assetUrl(user?.avatar);
  const companyName = company?.name ?? (user?.role === 'superadmin' ? 'Administración global' : '');
  const moduleByPage: Record<string, string> = { dashboard: 'dashboard', pos: 'pos', sales: 'pos', products: 'products', inventory: 'inventory', customers: 'customers', cash: 'cash', invoices: 'invoices', reports: 'reports', users: 'users', roles: 'roles', audit: 'audit', config: 'settings' };
  const visibleNavGroups = user?.role === 'superadmin'
    ? [{ label: 'Plataforma', items: [{ id: 'superadmin', label: 'Empresas y uso', icon: Building2 }] }]
    : navGroups.map(group => ({ ...group, items: group.items.filter(item => {
      if (['config', 'profile'].includes(item.id)) return false;
      if (user?.role === 'cashier' && ['roles', 'audit'].includes(item.id)) return false;
      return !company?.modules || company.modules.includes(moduleByPage[item.id] || item.id);
    }) })).filter(group => group.items.length > 0);

  const SidebarContent = () => (
    <div className="flex flex-col h-full sidebar-scroll overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <div>
            <div className="text-white font-bold text-base leading-none">Zentry</div>
            <div className="text-slate-400 text-xs font-medium">POS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {visibleNavGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setPage(item.id as Page); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-blue-600 text-white'
                        : item.highlight
                        ? 'bg-blue-600/15 text-blue-400 hover:bg-blue-600/25'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span>{item.label}</span>
                    {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="relative p-3 border-t border-slate-800">
        {userMenuLocation === 'sidebar' && <UserMenu above role={user?.role} onAction={(target) => { setPage(target); setUserMenuLocation(null); setSidebarOpen(false); }} onLogout={handleLogout} />}
        <button onClick={() => setUserMenuLocation(userMenuLocation === 'sidebar' ? null : 'sidebar')} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden">{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-white text-xs font-bold">{userInitials}</span>}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-200 truncate">{userName}</p><p className="text-xs text-slate-500 truncate">{userRole}</p></div>
          <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Company */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-slate-700">{companyName}</span>
            <span className="hidden md:inline text-xs text-slate-400 ml-1">— Caja principal abierta</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
            </button>

            {/* User avatar */}
            <div className="relative">
              <button
                onClick={() => setUserMenuLocation(userMenuLocation === 'navbar' ? null : 'navbar')}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-white text-xs font-bold">{userInitials}</span>}</div>
                <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
              </button>
              {userMenuLocation === 'navbar' && (
                <UserMenu role={user?.role} onAction={(target) => { setPage(target); setUserMenuLocation(null); }} onLogout={handleLogout} />
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
