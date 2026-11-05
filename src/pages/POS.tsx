import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle,
  User as UserIcon,
  Receipt,
  Download,
  ShoppingBag,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  DollarSign,
  Printer,
} from 'lucide-react';
import { products as demoProducts, customers as demoCustomers, fmt } from '../data/demo';
import {
  productApi,
  customerApi,
  cashApi,
  saleApi,
  Product,
  Customer,
  CashSession,
  Sale,
  tokenStorage,
} from '../services/api';
import { printReceipt } from '../utils/printReceipt';

interface CartItem {
  product: Product | (typeof demoProducts)[0];
  qty: number;
}

type Modal = 'none' | 'payment' | 'success';
type PayMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';

interface POSProps {
  setPage: (p: string) => void;
}

export default function POS({ setPage }: POSProps) {
  const [productsList, setProductsList] = useState<any[]>(demoProducts);
  const [customersList, setCustomersList] = useState<any[]>(demoCustomers);
  const [activeCashSession, setActiveCashSession] = useState<CashSession | null>(null);

  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [modal, setModal] = useState<Modal>('none');
  const [payMethod, setPayMethod] = useState<PayMethod>('efectivo');
  const [received, setReceived] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Carga inicial de productos, clientes y sesión de caja
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prodRes, custRes, cashRes] = await Promise.allSettled([
          productApi.list({ per_page: 50 }),
          customerApi.list({ per_page: 50 }),
          cashApi.getCurrent(),
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value.data?.length > 0) {
          setProductsList(prodRes.value.data);
        }
        if (custRes.status === 'fulfilled' && custRes.value.data?.length > 0) {
          setCustomersList(custRes.value.data);
        }
        if (cashRes.status === 'fulfilled' && cashRes.value.data?.session) {
          setActiveCashSession(cashRes.value.data.session);
        }
      } catch (e) {
        console.warn('Usando catálogo demo en modo autónomo');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Búsqueda dinámica de productos
  useEffect(() => {
    if (!search.trim()) return;

    const timer = setTimeout(async () => {
      try {
        const res = await productApi.search(search.trim());
        if (res.data) {
          setProductsList(res.data);
        }
      } catch (e) {
        // Fallback a filtro local
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const filtered = productsList.filter((p) => {
    const stockVal = typeof p.stock === 'string' ? parseFloat(p.stock) : p.stock;
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    // Mostrar si tiene stock o no trackea stock
    const hasStock = p.track_stock === false || stockVal > 0;
    return hasStock && matchesSearch;
  });

  const addToCart = (product: any) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.product.id === product.id);
      if (ex) {
        const maxStock = typeof product.stock === 'string' ? parseFloat(product.stock) : product.stock;
        if (product.track_stock !== false && ex.qty >= maxStock) {
          alert(`Stock máximo alcanzado (${maxStock} unidades disponibles).`);
          return prev;
        }
        return prev.map((c) => (c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id === id) {
            const nextQty = c.qty + delta;
            const pAny = c.product as any;
            const maxStock = typeof pAny.stock === 'string' ? parseFloat(pAny.stock) : pAny.stock;
            if (delta > 0 && pAny.track_stock !== false && nextQty > maxStock) {
              alert(`Stock insuficiente. Disponible: ${maxStock}`);
              return c;
            }
            return { ...c, qty: nextQty };
          }
          return c;
        })
        .filter((c) => c.qty > 0)
    );
  };

  const removeItem = (id: number) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  const subtotal = cart.reduce((s, c) => {
    const price = typeof c.product.price === 'string' ? parseFloat(c.product.price) : c.product.price;
    return s + price * c.qty;
  }, 0);

  const tax = Math.round((subtotal - discount) * 0.19);
  const total = Math.max(0, subtotal - discount + tax);
  const change = received - total;

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) return;
    setReceived(total);
    setErrorMessage(null);
    setModal('payment');
  };

  const handleProcessSale = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    // Mapeo del método de pago a los valores aceptados por Laravel
    const methodMap: Record<PayMethod, 'cash' | 'card' | 'transfer' | 'credit'> = {
      efectivo: 'cash',
      tarjeta: 'card',
      transferencia: 'transfer',
      credito: 'credit',
    };

    const payload = {
      customer_id: selectedCustomer?.id || null,
      discount_amount: discount,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price,
      })),
      payments: [
        {
          payment_method: methodMap[payMethod],
          amount: total,
          tendered: payMethod === 'efectivo' ? received : total,
        },
      ],
    };

    try {
      const res = await saleApi.create(payload);
      setCompletedSale(res.data);
      setModal('success');
    } catch (err: any) {
      console.warn('No se pudo registrar la venta:', err.message);
      if (err.errors) {
        const firstErr = Object.values(err.errors)[0] as string[];
        setErrorMessage(firstErr?.[0] || err.message);
      } else {
        setErrorMessage(err.message || 'Error al procesar la venta en el servidor');
      }

    } finally {
      setSubmitting(false);
    }
  };

  if (modal === 'success') {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full p-8 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">¡Venta realizada!</h2>
          <p className="text-slate-500 text-sm mb-6">La venta fue procesada y registrada en el Kardex y Caja.</p>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-left mb-6 border border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Factura oficial</span>
              <span className="font-bold text-blue-700">{completedSale?.invoice_number || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total pagado</span>
              <span className="font-bold text-slate-900">{fmt(total)}</span>
            </div>
            {payMethod === 'efectivo' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Efectivo entregado</span>
                  <span className="font-medium text-slate-700">{fmt(received)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Cambio / Vueltos</span>
                  <span className="font-bold text-emerald-600">{fmt(Math.max(0, change))}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cliente</span>
              <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                {selectedCustomer?.name || 'Consumidor final'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Método</span>
              <span className="font-semibold text-slate-900 capitalize">{payMethod}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => completedSale && printReceipt({ ...completedSale, customer: selectedCustomer, user: tokenStorage.getUser() || undefined, payments: [{ payment_method: payMethod === 'efectivo' ? 'cash' : payMethod === 'tarjeta' ? 'card' : payMethod === 'transferencia' ? 'transfer' : 'credit' }] as any }, cart.map(i => ({ name: i.product.name, quantity: i.qty, price: Number(i.product.price) })))} className="py-2.5 text-xs border border-blue-200 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 font-semibold flex items-center justify-center gap-1"><Printer size={15}/> Imprimir colilla</button>
            <button
              onClick={() => setPage('invoices')}
              className="py-2.5 text-xs border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <Receipt size={16} /> <span>Historial ventas</span>
            </button>
            <button
              onClick={() => {
                setCart([]);
                setModal('none');
                setSelectedCustomer(null);
                setDiscount(0);
                setCompletedSale(null);
              }}
              className="py-2.5 text-xs bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
            >
              <ShoppingBag size={16} /> <span>Nueva venta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* Left — product search and catalog */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-slate-50/50">
        <div className="p-5 border-b border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900">Terminal de Venta (POS)</h1>
            {activeCashSession ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Caja activa
              </span>
            ) : (
              <button
                onClick={() => setPage('cash')}
                className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 transition-colors"
              >
                <DollarSign size={13} /> Abrir turno de caja
              </button>
            )}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Buscar por nombre, SKU o escanear código de barras..."
            />
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((p) => {
                const stockVal = typeof p.stock === 'string' ? parseFloat(p.stock) : p.stock;
                const minStockVal = typeof p.stock_min === 'string' ? parseFloat(p.stock_min) : (p.minStock ?? 2);
                const priceVal = typeof p.price === 'string' ? parseFloat(p.price) : p.price;

                return (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <ShoppingBag size={18} className="text-blue-600" />
                        </div>
                        {p.track_stock === false ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                            Servicio
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              stockVal > minStockVal
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {stockVal} disponible
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 mb-0.5 line-clamp-1">{p.name}</p>
                      <p className="text-xs text-slate-400 mb-3 font-mono">SKU: {p.sku || 'N/A'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-base font-bold text-slate-900">{fmt(priceVal)}</span>
                      <button
                        onClick={() => addToCart(p)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <Plus size={13} /> Agregar
                      </button>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="col-span-3 py-16 text-center text-slate-400">
                  <ShoppingBag size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No se encontraron productos disponibles.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Cart Preview */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 bg-white">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">
                Carrito de compra ({cart.length} {cart.length === 1 ? 'producto' : 'productos'})
              </h3>
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
              {cart.map((item) => {
                const itemPrice = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
                return (
                  <div key={item.product.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{fmt(itemPrice)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-semibold w-7 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-600"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-28 text-right">
                      {fmt(itemPrice * item.qty)}
                    </span>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors ml-2"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right — Order Summary & Checkout */}
      <div className="w-full lg:w-80 xl:w-96 bg-white flex flex-col border-t lg:border-t-0 border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-3">Resumen de venta</h2>

          {/* Customer Selector */}
          {selectedCustomer ? (
            <div className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {selectedCustomer.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{selectedCustomer.name}</p>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.document_number || selectedCustomer.doc || 'Identificación registrada'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowCustomers(!showCustomers)}
                className="w-full flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                <UserIcon size={15} /> Seleccionar cliente
                <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  Consumidor final
                </span>
              </button>

              {showCustomers && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {customersList
                    .filter((c) =>
                      customerSearch === '' ||
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      (c.document_number && c.document_number.includes(customerSearch))
                    )
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setShowCustomers(false);
                          setCustomerSearch('');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                          {c.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                          <p className="text-xs text-slate-400">
                            {c.document_type || 'CC'} {c.document_number || c.doc || ''}
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-5 flex-1 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-800">{fmt(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-500">Descuento global</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">$</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-20 px-2 py-0.5 text-right border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-500">IVA estimado (19%)</span>
            <span className="font-medium text-slate-800">{fmt(tax)}</span>
          </div>

          <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
            <span className="text-base font-bold text-slate-900">TOTAL</span>
            <span className="text-2xl font-bold text-slate-900">{fmt(total)}</span>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleOpenPaymentModal}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-colors text-base shadow-sm"
          >
            {cart.length === 0 ? 'Agrega productos al carrito' : `Cobrar ${fmt(total)}`}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {modal === 'payment' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Finalizar venta</h2>
              <button
                onClick={() => setModal('none')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-0.5">Total a liquidar</p>
                <p className="text-3xl font-bold text-slate-900">{fmt(total)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">
                  Método de pago
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                    { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                    { id: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
                    { id: 'credito', label: 'A Crédito', icon: MoreHorizontal },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPayMethod(id as PayMethod)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 font-medium text-xs transition-all ${
                        payMethod === id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={20} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {payMethod === 'efectivo' && (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Efectivo recibido del cliente
                    </label>
                    <input
                      type="number"
                      value={received}
                      onChange={(e) => setReceived(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-slate-500">Cambio a devolver:</span>
                    <span
                      className={`font-bold ${
                        change >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {fmt(change)}
                    </span>
                  </div>
                </div>
              )}

              {payMethod === 'credito' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  {selectedCustomer ? (
                    <p>
                      Se cargará el monto a la cuenta de crédito de{' '}
                      <strong>{selectedCustomer.name}</strong>.
                    </p>
                  ) : (
                    <p className="font-semibold text-red-600">
                      ⚠️ Debe seleccionar un cliente antes de autorizar una venta a crédito.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleProcessSale}
                disabled={submitting || (payMethod === 'credito' && !selectedCustomer)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Confirmar y registrar venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
