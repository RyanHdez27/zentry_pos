import { useState } from 'react';
import { Search, Plus, Minus, Trash2, X, CheckCircle, User, Receipt, Download, ShoppingBag, CreditCard, Banknote, ArrowLeftRight, MoreHorizontal } from 'lucide-react';
import { products, customers, fmt } from '../data/demo';

interface CartItem {
  product: (typeof products)[0];
  qty: number;
}

type Modal = 'none' | 'payment' | 'success';
type PayMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';

interface POSProps {
  setPage: (p: string) => void;
}

export default function POS({ setPage }: POSProps) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof customers)[0] | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [discount, setDiscount] = useState(10000);
  const [modal, setModal] = useState<Modal>('none');
  const [payMethod, setPayMethod] = useState<PayMethod>('efectivo');
  const [received, setReceived] = useState(250000);

  const filtered = products.filter(
    (p) => p.stock > 0 && (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product: (typeof products)[0]) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.product.id === product.id);
      if (ex) return prev.map((c) => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => c.product.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter((c) => c.qty > 0)
    );
  };

  const removeItem = (id: number) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
  const tax = Math.round((subtotal - discount) * 0.19);
  const total = subtotal - discount + tax;
  const change = received - total;

  const handleSuccess = () => {
    setModal('success');
  };

  if (modal === 'success') {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">¡Venta realizada!</h2>
          <p className="text-slate-500 text-sm mb-6">La venta fue procesada correctamente.</p>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-left mb-6">
            {[
              ['Venta', '#FV-000152'],
              ['Total', fmt(total)],
              ['Cliente', selectedCustomer?.name ?? 'Consumidor final'],
              ['Método', payMethod.charAt(0).toUpperCase() + payMethod.slice(1)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="font-semibold text-slate-900">{v}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setPage('invoice-detail')} className="col-span-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex flex-col items-center gap-1">
              <Receipt size={16} /> <span>Ver factura</span>
            </button>
            <button className="col-span-1 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 flex flex-col items-center gap-1">
              <Download size={16} /> <span>Descargar</span>
            </button>
            <button
              onClick={() => { setCart([]); setModal('none'); setSelectedCustomer(null); setDiscount(0); }}
              className="col-span-1 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex flex-col items-center gap-1"
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
      {/* Left — product search */}
      <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-white">
          <h1 className="text-lg font-bold text-slate-900 mb-3">Nueva venta</h1>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Buscar producto o escanear código..."
            />
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ShoppingBag size={18} className="text-slate-400" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.stock > p.minStock ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {p.stock} en stock
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5 leading-snug">{p.name}</p>
                <p className="text-xs text-slate-400 mb-3">SKU: {p.sku}</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{fmt(p.price)}</span>
                  <button
                    onClick={() => addToCart(p)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={13} /> Agregar
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 py-12 text-center text-slate-400">
                <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No se encontraron productos.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 bg-white">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Carrito ({cart.length} items)</h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{fmt(item.product.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100">
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100">
                      <Plus size={11} />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-slate-900 w-24 text-right">{fmt(item.product.price * item.qty)}</span>
                  <button onClick={() => removeItem(item.product.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right — summary */}
      <div className="w-full lg:w-80 xl:w-96 bg-white flex flex-col border-t lg:border-t-0 border-slate-200">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-3">Resumen de venta</h2>

          {/* Customer */}
          {selectedCustomer ? (
            <div className="flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {selectedCustomer.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{selectedCustomer.name}</p>
                <p className="text-xs text-slate-500">{selectedCustomer.doc}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowCustomers(!showCustomers)}
                className="w-full flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                <User size={15} /> Seleccionar cliente
                <span className="ml-auto text-xs bg-slate-100 px-2 py-0.5 rounded">Consumidor final</span>
              </button>
              {showCustomers && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setShowCustomers(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.doc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-5 flex-1">
          <div className="space-y-3">
            {[
              { label: 'Subtotal', value: fmt(subtotal) },
              { label: 'Descuento', value: `-${fmt(discount)}`, neg: true },
              { label: 'IVA (19%)', value: fmt(tax) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-slate-500">{row.label}</span>
                <span className={`font-medium ${row.neg ? 'text-emerald-600' : 'text-slate-700'}`}>{row.value}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-3 flex justify-between">
              <span className="text-base font-bold text-slate-900">TOTAL</span>
              <span className="text-xl font-bold text-slate-900">{fmt(total)}</span>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200">
          <button
            onClick={() => cart.length > 0 && setModal('payment')}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-colors text-base"
          >
            {cart.length === 0 ? 'Agrega productos al carrito' : `Cobrar ${fmt(total)}`}
          </button>
        </div>
      </div>

      {/* Payment modal */}
      {modal === 'payment' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Finalizar venta</h2>
              <button onClick={() => setModal('none')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 mb-1">Total a cobrar</p>
                <p className="text-4xl font-bold text-slate-900">{fmt(total)}</p>
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Método de pago</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
                  { id: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
                  { id: 'otro', label: 'Otro', icon: MoreHorizontal },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPayMethod(id as PayMethod)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-medium text-sm transition-all ${
                      payMethod === id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={22} />
                    {label}
                  </button>
                ))}
              </div>

              {payMethod === 'efectivo' && (
                <div className="space-y-3 mb-4 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">Monto recibido</label>
                    <input
                      type="number"
                      value={received}
                      onChange={(e) => setReceived(Number(e.target.value))}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cambio:</span>
                    <span className={`font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(change)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSuccess}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
              >
                Confirmar pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
