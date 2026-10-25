import { useState } from 'react';
import { Search, Plus, Upload, Download, MoreHorizontal, Package, Filter, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, X, CheckCircle } from 'lucide-react';
import { products, fmt } from '../data/demo';

interface ProductsProps {
  setPage: (p: string) => void;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok: 'bg-emerald-50 text-emerald-700',
    low: 'bg-amber-50 text-amber-700',
    out: 'bg-red-50 text-red-700',
  };
  const labels: Record<string, string> = { ok: 'En stock', low: 'Stock bajo', out: 'Agotado' };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[status]}`}>{labels[status]}</span>;
}

function NewProductModal({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', barcode: '', category: 'Periféricos', desc: '', cost: '', price: '', tax: '19', minStock: '', unit: 'Unidad' });
  const categories = ['Periféricos', 'Monitores', 'Audio', 'Almacenamiento', 'Cables'];
  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Producto guardado</h3>
          <p className="text-sm text-slate-500 mb-6">El producto fue creado exitosamente.</p>
          <button onClick={onClose} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Nuevo producto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General info */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Información general</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre del producto *</label>
                <input value={form.name} onChange={f('name')} placeholder="Ej: Mouse Logitech M185" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">SKU *</label>
                <input value={form.sku} onChange={f('sku')} placeholder="MOU-001" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Código de barras</label>
                <input value={form.barcode} onChange={f('barcode')} placeholder="7501234567890" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoría</label>
                <select value={form.category} onChange={f('category')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Descripción</label>
                <textarea value={form.desc} onChange={f('desc')} rows={2} placeholder="Descripción del producto..." className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Price */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Precio</h3>
            <div className="grid grid-cols-3 gap-4">
              {[['cost', 'Precio de compra', '$0'], ['price', 'Precio de venta *', '$0'], ['tax', 'Impuesto (%)', '19']].map(([k, l, ph]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{l}</label>
                  <input value={(form as any)[k]} onChange={f(k)} placeholder={ph} type="number" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Inventario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Stock mínimo</label>
                <input value={form.minStock} onChange={f('minStock')} placeholder="10" type="number" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Unidad de medida</label>
                <select value={form.unit} onChange={f('unit')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {['Unidad', 'Caja', 'Par', 'Kg', 'Litro'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Image */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Imagen</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Arrastra o <span className="text-blue-600 font-medium">selecciona una imagen</span></p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG hasta 5MB</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={() => setSaved(true)} className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Guardar producto</button>
        </div>
      </div>
    </div>
  );
}

export default function Products({ setPage }: ProductsProps) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || p.category === categoryFilter;
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {showModal && <NewProductModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} productos registrados</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            <Upload size={15} /> Importar
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            <Download size={15} /> Exportar
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-500 text-slate-600">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-blue-500 text-slate-600">
          <option value="">Todos los estados</option>
          <option value="ok">En stock</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotado</option>
        </select>
        {(search || categoryFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); }} className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Producto', 'SKU', 'Categoría', 'Precio', 'Stock', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Package size={16} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 font-mono">{p.sku}</td>
                  <td className="px-5 py-4"><span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">{p.category}</span></td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">{fmt(p.price)}</td>
                  <td className="px-5 py-4">
                    <div>
                      <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : p.stock < p.minStock ? 'text-amber-600' : 'text-slate-800'}`}>{p.stock}</span>
                      <span className="text-xs text-slate-400"> / mín {p.minStock}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage('product-detail')} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver">
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">Mostrando {filtered.length} de {products.length} productos</p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"><ChevronLeft size={16} /></button>
            {[1, 2, 3].map((n) => (
              <button key={n} className={`w-8 h-8 rounded-lg text-sm font-medium ${n === 1 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{n}</button>
            ))}
            <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
