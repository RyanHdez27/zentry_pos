# 🚀 Zentry POS — Hoja de Ruta y Estado del Proyecto (Roadmap)

> **Zentry POS**: Sistema SaaS Multi-tenant de Gestión Comercial y Punto de Venta.
> Documento de seguimiento de hitos completados y fases pendientes para evolución comercial.

---

## 📌 Estado Actual del Proyecto (Hitos Completados)

### 1. Interfaz y Experiencia Visual (Frontend Demo Interactivo)
- [x] **Stack Moderno**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Recharts.
- [x] **Vistas de Figma implementadas y funcionales con datos mock**:
  - **Punto de Venta (POS)**: Catálogo rápido en cuadrícula, selector de cantidades, carrito dinámico, cálculo automático de subtotal, IVA y total, modal de cobro multipago (efectivo, tarjeta, transferencia).
  - **Dashboard Principal**: Métricas clave (Ventas hoy, facturas, clientes, ticket promedio), gráficas de ventas semanales, distribución por categorías y métodos de pago, productos más vendidos.
  - **Catálogo de Productos**: Listado con filtros, badges de estado de stock (óptimo, bajo, agotado), buscador y detalle de producto.
  - **Inventario**: Control de existencias, stock mínimo, valorización de inventario y vista de movimientos auditables (Kardex).
  - **Clientes**: Directorio de clientes con historial de compras, documentos (NIT/CC) y estado.
  - **Caja & Turnos**: Apertura, arqueo, ingresos, egresos y cierre de caja.
  - **Facturas / Ventas**: Historial de comprobantes emitidos, estados (emitida, cancelada, borrador) y detalle de factura.
  - **Reportes**: Análisis de rendimiento, ventas por cajero, horas pico y márgenes.
  - **Usuarios & Roles**: Control de personal (Admin, Cajero, Inventario) y matriz de permisos.
  - **Configuración de Negocio**: Datos fiscales, prefijo de facturación, moneda (COP/USD) e impuestos.
  - **Auditoría**: Bitácora de acciones críticas de usuarios.
- [x] **Despliegue a GitHub Pages**: Pipeline CI/CD automatizado mediante GitHub Actions (`.github/workflows/deploy.yml`) y enlaces relativos (`base: './'`) para demostraciones interactivas a clientes potenciales.

### 2. Infraestructura y Arquitectura Backend (Base Multi-tenant)
- [x] **Laravel 12 + Sanctum**: Configuración de API REST versionada (`/api/v1`).
- [x] **Multi-Tenancy Foundation**:
  - Tabla y modelo `Company`: aislamiento por empresa (nombre, NIT, moneda, prefijo de facturación, impuestos).
  - Tabla y modelo `User`: asociación a empresa (`company_id`), roles (`admin`, `cashier`, `inventory`), estado (`active`, `inactive`) y tokens Bearer de Sanctum.
  - `CompanyScope` y Trait `BelongsToCompany`: aislamiento global automático a nivel de base de datos para garantizar que ningún inquilino acceda a datos de otro.
- [x] **Esquema Híbrido de Base de Datos**:
  - SQLite en desarrollo local (`backend/.env`) para programar sin sobrecosto de memoria.
  - Docker Compose (`postgres:16-alpine` + PHP 8.2 Nginx Supervisor) y `.env.example` listos para entorno de producción y compatibilidad nativa con **Supabase**.
- [x] **Seeders de Demostración**: Carga de empresa demo "Zentry Tech Store" y usuarios comerciales listos para pruebas.
- [x] **Pruebas Automatizadas**: 11 pruebas unitarias y de integración pasando al 100% en memoria (`php artisan test`).

---

## 📋 Fases Pendientes (Para Implementación con Clientes Reales)

Cuando se requiera pasar de la versión de demostración comercial a la operación con empresas reales en producción, se activarán las siguientes fases:

### 🧩 Fase 2: Catálogo de Productos, Categorías y Precios
- [ ] Migración `categories` (nombre, slug, descripción, `company_id`).
- [ ] Migración `products` (nombre, SKU único por empresa, código de barras, categoría, precio de venta, costo, stock mínimo, impuesto, unidad de medida, `company_id`).
- [ ] Controlador `ProductController` y `CategoryController` (CRUD con validación de SKU por tenant).
- [ ] Conectar la vista de `Products.tsx` del frontend con los endpoints reales de la API.

### 📦 Fase 3: Inventario, Existencias y Kardex Auditable
- [ ] Migración `inventory_movements` (tipo: entrada, salida, ajuste, venta; cantidad; stock anterior; stock resultante; motivo; usuario; `company_id`).
- [ ] Servicio transaccional `InventoryService` con bloqueos pesimistas (`lockForUpdate`) para evitar inconsistencias en ventas concurrentes.
- [ ] Conectar la vista de `Inventory.tsx` con el historial de movimientos reales.

### 👥 Fase 4: Clientes y Cuentas
- [ ] Migración `customers` (documento/NIT, tipo de documento, nombre, teléfono, email, dirección, `company_id`).
- [ ] Endpoints de búsqueda rápida para el POS (autocompletado por nombre o cédula).
- [ ] Historial acumulado de compras por cliente.

### 💳 Fase 5: POS Transaccional, Turnos de Caja y Pagos
- [ ] Migración `cash_registers` y `cash_shifts` (apertura de caja, saldo inicial, ingresos, egresos, arqueo ciego, cierre).
- [ ] Migración `orders` y `order_items` (ventas, detalle de ítems, totales, descuentos, impuestos).
- [ ] Migración `payments` (método: efectivo, datáfono/tarjeta, transferencia, referencia).
- [ ] Transacción atómica de venta:
  1. Validar existencias disponibles.
  2. Registrar orden y sus ítems.
  3. Descontar existencias y generar movimiento de inventario.
  4. Registrar pago e impacto en el turno de caja activo.
  5. Asignar consecutivo de factura oficial.
- [ ] Conectar el carrito y cobro de `POS.tsx` a la API.

### 🧾 Fase 6: Facturación y Comprobantes
- [ ] Generación de tirilla de venta en formato para impresora térmica (80mm / 58mm).
- [ ] Generador de PDF de facturas.
- [ ] Preparación de contrato para facturación electrónica (DIAN Colombia u otros proveedores de timbrado).

### ☁️ Fase 7: Despliegue en la Nube con Supabase
- [ ] Crear proyecto en [Supabase](https://supabase.com).
- [ ] Configurar variables de conexión `DB_CONNECTION=pgsql`, `DB_HOST=aws-0-...supabase.co`, etc.
- [ ] Ejecutar migraciones y seeders en el PostgreSQL administrado de Supabase.
- [ ] Desplegar la API de Laravel en VPS / Railway / Render / Fly.io.

---

*Última actualización: Octubre 2026 — Zentry POS Core Team.*
