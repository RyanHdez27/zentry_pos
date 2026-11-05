import { lazy, Suspense, useState, useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';
import { authApi, tokenStorage } from './services/api';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Customers = lazy(() => import('./pages/Customers'));
const Cash = lazy(() => import('./pages/Cash'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Reports = lazy(() => import('./pages/Reports'));
const Users = lazy(() => import('./pages/Users'));
const Roles = lazy(() => import('./pages/Roles'));
const Config = lazy(() => import('./pages/Config'));
const Audit = lazy(() => import('./pages/Audit'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const Profile = lazy(() => import('./pages/Profile'));

type Page =
  | 'dashboard' | 'pos' | 'sales' | 'products' | 'product-new' | 'product-detail'
  | 'inventory' | 'inventory-movements' | 'customers' | 'customer-detail'
  | 'cash' | 'invoices' | 'invoice-detail' | 'reports'
  | 'users' | 'roles' | 'config' | 'audit' | 'superadmin' | 'profile';

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(() => {
    return Boolean(tokenStorage.get());
  });
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState(() => tokenStorage.getUser());

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoggedIn(false);
      return;
    }
    authApi.me().then((res) => {
      if (res.data?.user) {
        tokenStorage.setUser(res.data.user);
        setCurrentUser(res.data.user);
        if (res.data.company) tokenStorage.setCompany(res.data.company);
        else localStorage.removeItem('zentry_company');
      }
    }).catch(() => {
      tokenStorage.clear();
      setCurrentUser(null);
      setLoggedIn(false);
    });
  }, []);

  const handleLogin = () => {
    setCurrentUser(tokenStorage.getUser());
    setLoggedIn(true);
  };

  const handleLogout = () => {
    tokenStorage.clear();
    setCurrentUser(null);
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    if (currentUser?.role === 'superadmin' && page !== 'profile') return <SuperAdmin />;
    switch (page) {
      case 'profile':
        return <Profile />;
      case 'dashboard':
        return <Dashboard setPage={setPage as (p: string) => void} />;
      case 'pos':
        return <POS setPage={setPage as (p: string) => void} />;
      case 'sales':
        return <Invoices setPage={setPage as (p: string) => void} />;
      case 'products':
        return (
          <Products
            setPage={setPage as (p: string) => void}
            onSelectProduct={(id) => {
              setSelectedProductId(id);
              setPage('product-detail');
            }}
          />
        );
      case 'product-detail':
        return (
          <ProductDetail
            productId={selectedProductId}
            onBack={() => setPage('products')}
          />
        );
      case 'inventory':
        return <Inventory />;
      case 'inventory-movements':
        return <Inventory subPage="movements" />;
      case 'customers':
        return <Customers setPage={setPage as (p: string) => void} />;
      case 'customer-detail':
        return <Customers setPage={setPage as (p: string) => void} showDetail />;
      case 'cash':
        return <Cash />;
      case 'invoices':
        return <Invoices setPage={setPage as (p: string) => void} />;
      case 'invoice-detail':
        return <Invoices setPage={setPage as (p: string) => void} showDetail />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <Users />;
      case 'roles':
        return <Roles />;
      case 'config':
        return <Config />;
      case 'audit':
        return <Audit />;
      default:
        return <Dashboard setPage={setPage as (p: string) => void} />;
    }
  };

  return (
    <Layout
      page={page}
      setPage={setPage as (p: string) => void}
      onLogout={handleLogout}
    >
      <Suspense fallback={<div className="flex h-full min-h-64 items-center justify-center text-blue-600"><Loader2 className="animate-spin" /></div>}>
        {renderPage()}
      </Suspense>
    </Layout>
  );
}
