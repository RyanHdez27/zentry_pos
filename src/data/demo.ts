export const products = [
  { id: 1, name: 'Mouse Logitech M185', sku: 'MOU-001', category: 'Periféricos', price: 80000, cost: 45000, stock: 5, minStock: 10, barcode: '7501234567890', status: 'low', tax: 19, unit: 'Unidad', image: '' },
  { id: 2, name: 'Teclado Logitech K120', sku: 'TEC-001', category: 'Periféricos', price: 60000, cost: 32000, stock: 3, minStock: 10, barcode: '7501234567891', status: 'low', tax: 19, unit: 'Unidad', image: '' },
  { id: 3, name: 'Monitor Samsung 24"', sku: 'MON-001', category: 'Monitores', price: 850000, cost: 580000, stock: 12, minStock: 5, barcode: '7501234567892', status: 'ok', tax: 19, unit: 'Unidad', image: '' },
  { id: 4, name: 'Cable HDMI 2m', sku: 'CAB-001', category: 'Cables', price: 25000, cost: 12000, stock: 2, minStock: 20, barcode: '7501234567893', status: 'low', tax: 19, unit: 'Unidad', image: '' },
  { id: 5, name: 'Audífonos JBL', sku: 'AUD-001', category: 'Audio', price: 60000, cost: 38000, stock: 18, minStock: 5, barcode: '7501234567894', status: 'ok', tax: 19, unit: 'Unidad', image: '' },
  { id: 6, name: 'Memoria USB 64GB', sku: 'USB-001', category: 'Almacenamiento', price: 45000, cost: 22000, stock: 0, minStock: 15, barcode: '7501234567895', status: 'out', tax: 19, unit: 'Unidad', image: '' },
  { id: 7, name: 'Webcam Logitech C920', sku: 'CAM-001', category: 'Periféricos', price: 320000, cost: 210000, stock: 8, minStock: 5, barcode: '7501234567896', status: 'ok', tax: 19, unit: 'Unidad', image: '' },
  { id: 8, name: 'Hub USB 4 puertos', sku: 'HUB-001', category: 'Cables', price: 55000, cost: 28000, stock: 25, minStock: 10, barcode: '7501234567897', status: 'ok', tax: 19, unit: 'Unidad', image: '' },
];

export const customers = [
  { id: 1, name: 'Juan Pérez', doc: 'CC 12345678', phone: '300 000 0000', email: 'juan@email.com', purchases: 28, total: 4850000, lastPurchase: '26 sep 2026', status: 'active' },
  { id: 2, name: 'María González', doc: 'CC 23456789', phone: '311 111 1111', email: 'maria@email.com', purchases: 14, total: 2100000, lastPurchase: '24 sep 2026', status: 'active' },
  { id: 3, name: 'Carlos Rodríguez', doc: 'CC 34567890', phone: '320 222 2222', email: 'carlos@email.com', purchases: 42, total: 8750000, lastPurchase: '26 sep 2026', status: 'active' },
  { id: 4, name: 'Laura Martínez', doc: 'CC 45678901', phone: '315 333 3333', email: 'laura@email.com', purchases: 7, total: 980000, lastPurchase: '20 sep 2026', status: 'inactive' },
  { id: 5, name: 'Andrés Gómez', doc: 'CC 56789012', phone: '317 444 4444', email: 'andres@email.com', purchases: 19, total: 3400000, lastPurchase: '25 sep 2026', status: 'active' },
];

export const invoices = [
  { id: 'FV-000152', customer: 'Juan Pérez', date: '26 sep 2026', total: 226100, status: 'emitida', items: 3, method: 'Efectivo' },
  { id: 'FV-000151', customer: 'María González', date: '26 sep 2026', total: 185000, status: 'emitida', items: 2, method: 'Tarjeta' },
  { id: 'FV-000150', customer: 'Carlos Rodríguez', date: '25 sep 2026', total: 950000, status: 'emitida', items: 1, method: 'Transferencia' },
  { id: 'FV-000149', customer: 'Consumidor final', date: '25 sep 2026', total: 80000, status: 'emitida', items: 1, method: 'Efectivo' },
  { id: 'FV-000148', customer: 'Laura Martínez', date: '24 sep 2026', total: 320000, status: 'cancelada', items: 2, method: 'Tarjeta' },
  { id: 'FV-000147', customer: 'Andrés Gómez', date: '24 sep 2026', total: 125000, status: 'borrador', items: 4, method: '-' },
];

export const salesChart = [
  { day: 'Lun 20', ventas: 1850000 },
  { day: 'Mar 21', ventas: 2400000 },
  { day: 'Mié 22', ventas: 1650000 },
  { day: 'Jue 23', ventas: 3100000 },
  { day: 'Vie 24', ventas: 2800000 },
  { day: 'Sáb 25', ventas: 3850000 },
  { day: 'Dom 26', ventas: 2450000 },
];

export const categoryChart = [
  { name: 'Periféricos', value: 45 },
  { name: 'Monitores', value: 22 },
  { name: 'Audio', value: 18 },
  { name: 'Almacenamiento', value: 10 },
  { name: 'Cables', value: 5 },
];

export const paymentChart = [
  { name: 'Efectivo', value: 48 },
  { name: 'Tarjeta', value: 35 },
  { name: 'Transferencia', value: 17 },
];

export const users = [
  { id: 1, name: 'Carlos Rodríguez', email: 'carlos@zentrypos.com', role: 'Administrador', status: 'active', lastAccess: '26 sep 2026, 10:25 AM', avatar: 'CR' },
  { id: 2, name: 'María González', email: 'maria@zentrypos.com', role: 'Cajero', status: 'active', lastAccess: '26 sep 2026, 09:15 AM', avatar: 'MG' },
  { id: 3, name: 'Juan Pérez', email: 'juan@zentrypos.com', role: 'Inventario', status: 'active', lastAccess: '25 sep 2026, 04:30 PM', avatar: 'JP' },
  { id: 4, name: 'Laura Martínez', email: 'laura@zentrypos.com', role: 'Cajero', status: 'inactive', lastAccess: '20 sep 2026, 11:00 AM', avatar: 'LM' },
];

export const auditLogs = [
  { user: 'Carlos Rodríguez', action: 'Actualizó producto', module: 'Productos', description: 'Mouse Logitech M185 — precio de $75.000 a $80.000', date: '26 sep 2026', time: '10:25 AM', avatar: 'CR' },
  { user: 'María González', action: 'Realizó venta', module: 'POS', description: 'Venta #FV-000152 por $226.100', date: '26 sep 2026', time: '10:31 AM', avatar: 'MG' },
  { user: 'Carlos Rodríguez', action: 'Abrió caja', module: 'Caja', description: 'Caja principal — monto inicial $200.000', date: '26 sep 2026', time: '08:00 AM', avatar: 'CR' },
  { user: 'Juan Pérez', action: 'Ajustó inventario', module: 'Inventario', description: 'Cable HDMI 2m — entrada de 20 unidades', date: '25 sep 2026', time: '03:45 PM', avatar: 'JP' },
  { user: 'María González', action: 'Realizó venta', module: 'POS', description: 'Venta #FV-000151 por $185.000', date: '26 sep 2026', time: '09:55 AM', avatar: 'MG' },
  { user: 'Carlos Rodríguez', action: 'Creó usuario', module: 'Usuarios', description: 'Nuevo usuario: laura@zentrypos.com', date: '24 sep 2026', time: '11:20 AM', avatar: 'CR' },
  { user: 'Juan Pérez', action: 'Creó producto', module: 'Productos', description: 'Hub USB 4 puertos — SKU: HUB-001', date: '23 sep 2026', time: '02:10 PM', avatar: 'JP' },
];

export const inventoryMovements = [
  { date: '26 sep 2026', time: '10:31 AM', product: 'Mouse Logitech M185', type: 'Venta', qty: -2, before: 7, after: 5, user: 'María González', reason: 'Venta #FV-000152' },
  { date: '26 sep 2026', time: '09:55 AM', product: 'Audífonos JBL', type: 'Venta', qty: -1, before: 19, after: 18, user: 'María González', reason: 'Venta #FV-000151' },
  { date: '25 sep 2026', time: '03:45 PM', product: 'Cable HDMI 2m', type: 'Entrada', qty: 20, before: 2, after: 22, user: 'Juan Pérez', reason: 'Compra a proveedor' },
  { date: '25 sep 2026', time: '11:00 AM', product: 'Teclado Logitech K120', type: 'Ajuste', qty: -5, before: 8, after: 3, user: 'Carlos Rodríguez', reason: 'Unidades dañadas' },
  { date: '24 sep 2026', time: '02:30 PM', product: 'Memoria USB 64GB', type: 'Venta', qty: -3, before: 3, after: 0, user: 'María González', reason: 'Venta #FV-000149' },
  { date: '23 sep 2026', time: '09:00 AM', product: 'Monitor Samsung 24"', type: 'Entrada', qty: 5, before: 7, after: 12, user: 'Juan Pérez', reason: 'Reposición de stock' },
];

export const fmt = (n: number) =>
  '$' + n.toLocaleString('es-CO');
