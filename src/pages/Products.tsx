import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Upload, Download, ChevronLeft, ChevronRight, Eye, Pencil, Trash2, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { productApi, categoryApi, type Product, type Category } from '../services/api';

interface ProductsProps {
  setPage: (p: string) => void;
  onSelectProduct?: (id: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: string | number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value));
}

function stockStatus(p: Product): 'ok' | 'low' | 'out' {
  if (!p.track_stock) return 'ok';
  const stock = Number(p.stock);
  if (stock <= 0) return 'out';
  if (stock <= Number(p.stock_min)) return 'low';
  return 'ok';
}

function StatusBadge({ status }: { status: 'ok' | 'low' | 'out' }) {
  const map = {
    ok:  'bg-emerald-50 text-emerald-700',
    low: 'bg-amber-50 text-amber-700',
    out: 'bg-red-50 text-red-700',
  };
  const labels = { ok: 'En stock', low: 'Stock bajo', out: 'Agotado' };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[status]}`}>{labels[status]}</span>;
}

// ─── Modal nuevo producto ─────────────────────────────────────────────────────

function NewProductModal({ categories, onClose, onCreated, product }: {
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
  product?: Product | null;
}) {
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [form, setForm] = useState(() => ({
    name: product?.name || '', sku: product?.sku || '', barcode: product?.barcode || '', category_id: product?.category_id ? String(product.category_id) : '',
    description: product?.description || '', cost: product?.cost || '', price: product?.price || '', tax_rate: product?.tax_rate || '19',
    stock: product?.stock || '0', stock_min: product?.stock_min || '', unit: product?.unit || 'unidad',
  }));

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      setApiError('Nombre y precio son obligatorios.');
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      const data = new FormData();
      Object.entries({ ...form, category_id: form.category_id || '', cost: form.cost || '0', stock_min: form.stock_min || '0' }).forEach(([key, value]) => data.append(key, String(value)));
      if (image) data.append('image', image);
      if (product) { data.append('_method', 'PUT'); await productApi.update(product.id, data); }
      else await productApi.create(data);
      setSaved(true);
      onCreated();
    } catch (err: any) {
      const msgs = err?.errors ? Object.values(err.errors as Record<string, string[]>).flat() : [];
      setApiError(msgs.length ? msgs.join(' · ') : err?.message || 'Error al guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">Producto guardado</h3>
          <p className="text-sm text-slate-500 mb-6">{product ? 'Los cambios fueron guardados.' : 'El producto fue creado exitosamente.'}</p>
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
          <h2 className="text-lg font-bold text-slate-900">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Información general */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Información general</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Nombre del producto *</label>
                <input value={form.name} onChange={f('name')} placeholder="Ej: Mouse Logitech M185" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">SKU</label>
                <input value={form.sku} onChange={f('sku')} placeholder="MOU-001" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Código de barras</label>
                <input value={form.barcode} onChange={f('barcode')} placeholder="7501234567890" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Categoría</label>
                <select value={form.category_id} onChange={f('category_id')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Descripción</label>
                <textarea value={form.description} onChange={f('description')} rows={2} placeholder="Descripción del producto..." className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Precio */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Precio</h3>
            <div className="grid grid-cols-3 gap-4">
              {[['cost', 'Precio de compra', '$0'], ['price', 'Precio de venta *', '$0'], ['tax_rate', 'Impuesto (%)', '19']].map(([k, l, ph]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{l}</label>
                  <input value={(form as any)[k]} onChange={f(k)} placeholder={ph} type="number" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Inventario */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Inventario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Stock inicial / actual</label>
                <input value={form.stock} onChange={f('stock')} min="0" step="0.001" type="number" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Stock mínimo</label>
                <input value={form.stock_min} onChange={f('stock_min')} placeholder="10" type="number" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Unidad de medida</label>
                <select value={form.unit} onChange={f('unit')} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white">
                  {['unidad', 'caja', 'par', 'kg', 'litro'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Imagen */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">Imagen</h3>
            <label className="block border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-blue-400 cursor-pointer">
              {image ? <img src={URL.createObjectURL(image)} alt="Vista previa" className="mx-auto mb-3 h-24 w-24 rounded-lg object-cover" /> : product?.image_url ? <img src={product.image_url} alt={product.name} className="mx-auto mb-3 h-24 w-24 rounded-lg object-cover" /> : <Upload size={24} className="mx-auto text-slate-400 mb-2" />}
              <p className="text-sm text-slate-500">{image?.name || 'Seleccionar imagen del producto'}</p><p className="text-xs text-slate-400 mt-1">PNG, JPG o WEBP · máximo 5 MB</p>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => setImage(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 flex-shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Guardar producto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Products({ setPage, onSelectProduct }: ProductsProps) {
  const [products, setProducts]       = useState<Product[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta]               = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });

  // Carga de datos
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        productApi.list({
          search:      search || undefined,
          category_id: categoryFilter ? Number(categoryFilter) : undefined,
          low_stock:   statusFilter === 'low' ? true : undefined,
          page:        currentPage,
          per_page:    20,
        }),
        categoryApi.list(),
      ]);
      setProducts(prodRes.data);
      setMeta(prodRes.meta);
      setCategories(catRes.data);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, statusFilter, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filtro de estado aplicado localmente sobre los datos ya paginados de la API
  const filtered = statusFilter === 'ok' || statusFilter === 'out'
    ? products.filter((p) => stockStatus(p) === statusFilter)
    : products;

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await productApi.delete(id);
      loadProducts();
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar.');
    }
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const first = await productApi.list({ per_page: 100, page: 1 });
      const all = [...first.data];
      for (let page = 2; page <= first.meta.last_page; page++) all.push(...(await productApi.list({ per_page: 100, page })).data);
      const rows = all.map(p => ({ name:p.name, sku:p.sku, barcode:p.barcode, description:p.description, price:Number(p.price), cost:Number(p.cost), tax_rate:Number(p.tax_rate), stock:Number(p.stock), stock_min:Number(p.stock_min), unit:p.unit, is_active:p.is_active, track_stock:p.track_stock }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Productos');
      XLSX.writeFile(workbook, 'productos-zentry.xlsx');
    } catch (e: any) { setError(e.message || 'No se pudieron exportar los productos.'); }
  };

  const importExcel = async (file: File) => {
    setError(null);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      let count = 0;
      for (const row of rows) {
        const name = String(row.name || '').trim(); if (!name) continue;
        await productApi.create({ name, sku: row.sku || undefined, barcode: row.barcode || undefined, description: row.description || undefined, price: String(Number(row.price || 0)), cost: String(Number(row.cost || 0)), tax_rate: String(Number(row.tax_rate || 0)), stock: String(Number(row.stock || 0)), stock_min: String(Number(row.stock_min || 0)), unit: row.unit || 'unidad', is_active: String(row.is_active).toLowerCase() !== 'false', track_stock: String(row.track_stock).toLowerCase() !== 'false' });
        count++;
      }
      setError(count ? `Importación completada: ${count} productos.` : 'El CSV no contiene productos válidos.'); await loadProducts();
    } catch (e: any) { setError(e.message || 'No se pudo importar el Excel. Revisa el nombre de las columnas.'); }
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {showModal && (
        <NewProductModal
          categories={categories}
          product={editingProduct}
          onClose={() => { setShowModal(false); setEditingProduct(null); }}
          onCreated={loadProducts}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total} productos registrados</p>
        </div>
        <div className="flex gap-2">
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" onChange={e => { const file=e.target.files?.[0]; if(file) void importExcel(file); e.currentTarget.value=''; }} />
          <button onClick={() => importRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
            <Upload size={15} /> Importar
          </button>
          <button onClick={() => void exportExcel()} className="flex items-center gap-2 px-4 py-2.5 text-sm border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
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
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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

      {/* Estado de carga / error */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span className="text-sm">Cargando productos...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={loadProducts} className="ml-auto text-xs underline">Reintentar</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                      No se encontraron productos.
                    </td>
                  </tr>
                ) : filtered.map((p) => {
                  const status = stockStatus(p);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                            style={{ backgroundColor: p.category?.color ?? '#94a3b8' }}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.barcode ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-mono">{p.sku ?? '—'}</td>
                      <td className="px-5 py-4">
                        {p.category
                          ? <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${p.category.color}20`, color: p.category.color }}>{p.category.name}</span>
                          : <span className="text-xs text-slate-400">—</span>
                        }
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{fmt(p.price)}</td>
                      <td className="px-5 py-4">
                        <div>
                          <span className={`text-sm font-bold ${status === 'out' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-slate-800'}`}>
                            {Number(p.stock)}
                          </span>
                          <span className="text-xs text-slate-400"> / mín {Number(p.stock_min)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (onSelectProduct) {
                                onSelectProduct(p.id);
                              } else {
                                setPage('product-detail');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver"
                          >
                            <Eye size={15} />
                          </button>
                          <button onClick={() => { setEditingProduct(p); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {filtered.length} de {meta.total} productos
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={meta.current_page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: meta.last_page }, (_, i) => i + 1).slice(0, 5).map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${n === meta.current_page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page === meta.last_page}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
