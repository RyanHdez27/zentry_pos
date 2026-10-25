import { useState } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Cash from './pages/Cash';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Config from './pages/Config';
import Audit from './pages/Audit';

type Page =
  | 'dashboard' | 'pos' | 'sales' | 'products' | 'product-new' | 'product-detail'
  | 'inventory' | 'inventory-movements' | 'customers' | 'customer-detail'
  | 'cash' | 'invoices' | 'invoice-detail' | 'reports'
  | 'users' | 'roles' | 'config' | 'audit';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState<Page>('dashboard');

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard setPage={setPage as (p: string) => void} />;
      case 'pos':
        return <POS setPage={setPage as (p: string) => void} />;
      case 'sales':
        return <Invoices setPage={setPage as (p: string) => void} />;
      case 'products':
        return <Products setPage={setPage as (p: string) => void} />;
      case 'product-detail':
        return <ProductDetail onBack={() => setPage('products')} />;
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
    <Layout page={page} setPage={setPage as (p: string) => void}>
      {renderPage()}
    </Layout>
  );
}
