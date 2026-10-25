import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, Users, DollarSign,
  FileText, BarChart2, UserCog, Shield, ClipboardList, Settings,
  Bell, Search, ChevronDown, Menu, X, LogOut, User, Plus, ChevronRight
} from 'lucide-react';

type Page =
  | 'dashboard' | 'pos' | 'sales' | 'products' | 'product-new' | 'product-detail'
  | 'inventory' | 'inventory-movements' | 'customers' | 'customer-detail'
  | 'cash' | 'invoices' | 'invoice-detail' | 'reports'
  | 'users' | 'roles' | 'config' | 'audit';

interface LayoutProps {
  page: Page;
  setPage: (p: Page) => void;
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
      { id: 'config', label: 'Configuración', icon: Settings },
    ],
  },
];

export default function Layout({ page, setPage, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
        {navGroups.map((group) => (
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
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">CR</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Carlos Rodríguez</p>
            <p className="text-xs text-slate-500 truncate">Administrador</p>
          </div>
          <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
        </div>
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
            <span className="text-sm font-medium text-slate-700">Empresa Demo S.A.S.</span>
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
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">CR</span>
                </div>
                <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <User size={15} className="text-slate-400" /> Mi perfil
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings size={15} className="text-slate-400" /> Configuración
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={15} /> Cerrar sesión
                  </button>
                </div>
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
