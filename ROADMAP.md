# 🚀 Zentry POS — Hoja de Ruta y Estado del Proyecto (Roadmap)

> **Zentry POS**: Sistema SaaS Multi-tenant de Gestión Comercial y Punto de Venta.
> Documento de seguimiento de hitos completados y fases para evolución comercial.

---

## 📌 Estado Actual del Proyecto (¡MVP 100% Finalizado!) 🚀

### 1. Interfaz y Experiencia Visual (Frontend Demo Interactivo)
- [x] **Stack Moderno**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Recharts.
- [x] **Todas las vistas conectadas e integradas con la API**:
  - **Punto de Venta (POS)**: Catálogo rápido en cuadrícula, selector de cantidades, carrito dinámico, cálculo automático de subtotal, IVA y total, cobro multipago (efectivo, tarjeta, transferencia, crédito) y emisión de facturas oficiales con consecutivo atómico.
  - **Caja & Turnos**: Apertura con saldo inicial, arqueo en tiempo real, registro de ingresos, egresos, retiros y cierre con cálculo de diferencias.
  - **Facturas / Ventas**: Historial de comprobantes emitidos en vivo, estados (emitida, cancelada), visualización de detalle con opción de impresión y anulación para administradores.
  - **Catálogo de Productos**: Listado con filtros, badges de estado de stock (óptimo, bajo, agotado), buscador y detalle de producto.
  - **Inventario**: Control de existencias, stock mínimo, valorización de inventario y vista de movimientos auditables (Kardex).
  - **Clientes**: Directorio de clientes con historial de compras, documentos (NIT/CC), límite de cupo y balance deudor.
  - **Dashboard Principal**: Métricas clave en vivo (Ventas hoy, facturas, clientes, ticket promedio), gráficas de ventas semanales, distribución por categorías y productos más vendidos.
  - **Reportes**: Análisis de rendimiento, ventas por cajero, margen comercial bruto y horas pico.
  - **Usuarios & Roles**: Control de personal (Admin, Cajero, Inventario), modales de creación/edición y matriz de permisos.
  - **Configuración de Negocio**: Datos fiscales, prefijo de facturación, moneda (COP/USD) e impuestos guardados en base de datos.
  - **Auditoría**: Bitácora de acciones críticas de usuarios (ventas, movimientos de inventario, turnos de caja) y exportación a CSV.
- [x] **Despliegue a GitHub Pages**: Pipeline CI/CD automatizado mediante GitHub Actions (`.github/workflows/deploy.yml`) y enlaces relativos (`base: './'`).

### 2. Infraestructura y Arquitectura Backend (Base Multi-tenant)
- [x] **Laravel 12 + Sanctum**: Configuración de API REST versionada (`/api/v1`).
- [x] **Multi-Tenancy Foundation**:
  - Tabla y modelo `Company`: aislamiento por empresa (nombre, NIT, moneda, prefijo de facturación, impuestos).
  - Tabla y modelo `User`: asociación a empresa (`company_id`), roles (`admin`, `cashier`, `inventory`), estado (`active`, `inactive`) y tokens Bearer de Sanctum.
  - `CompanyScope` y Trait `BelongsToCompany`: aislamiento global automático a nivel de base de datos para garantizar que ningún inquilino acceda a datos de otro.
- [x] **Esquema Híbrido de Base de Datos**:
  - SQLite en desarrollo local (`backend/.env`) para pruebas ultrarrápidas.
  - Docker Compose (`postgres:16-alpine` + PHP 8.2 Nginx Supervisor) y `.env.example` listos para entorno de producción y compatibilidad nativa con **Supabase**.
- [x] **Seeders de Demostración**: Carga de empresa demo "Zentry Tech Store", usuarios comerciales, catálogo, clientes, caja y ventas iniciales.
- [x] **Pruebas Automatizadas**: **98 pruebas unitarias y de integración pasando al 100% (340 aserciones)** en ~2.2 segundos.

---

## 📋 Estado de Fases de Implementación (MVP y Producción)

### ✅ Fase 1: Infraestructura Multi-tenant, Auth Sanctum y Permisos por Rol
- [x] Filtrado del Menú Lateral (`Layout.tsx`) por rol.
- [x] Selector rápido de perfil en Login.
- [x] Header y Perfil reactivos con token Bearer.
- [x] Middleware `EnsureRole` y guards multi-tenant.
- [x] **Tests Automatizados**: 8 pruebas unitarias y de integración.

### ✅ Fase 2: Catálogo de Productos, Categorías y Precios
- [x] Migración `categories` (nombre, slug único por empresa, color, icono, `company_id`).
- [x] Migración `products` (nombre, SKU y código de barras únicos por empresa, categoría, precio, costo, stock mínimo, impuesto, unidad, `SoftDeletes`, `company_id`).
- [x] Controladores `ProductController` y `CategoryController`.
- [x] Búsqueda rápida `/api/v1/products/search?q=...` optimizada para el POS.
- [x] Conexión de `src/pages/Products.tsx` y `src/pages/ProductDetail.tsx`.
- [x] **Tests Automatizados**: 29 pruebas passing para categorías y productos.

### ✅ Fase 3: Inventario, Existencias y Kardex Auditable
- [x] Migración `inventory_movements` (inmutable: tipo entrada, salida, ajuste, venta; cantidades; stock previo y resultante; motivo; documento; notas).
- [x] Servicio transaccional `InventoryService` con `DB::transaction()` y bloqueos pesimistas (`lockForUpdate`).
- [x] Endpoints `/api/v1/inventory/summary`, `/api/v1/inventory/movements`, `/api/v1/inventory/adjust`.
- [x] Conexión de `src/pages/Inventory.tsx` y pestaña de kardex en `src/pages/ProductDetail.tsx`.
- [x] **Tests Automatizados**: 12 pruebas passing para inventario y transaccionalidad.

### ✅ Fase 4: Clientes y CRM Base
- [x] Migración `customers` (documento único por empresa, tipo de doc, nombre, razón social, teléfono, email, cupo de crédito, balance deudor, `SoftDeletes`, `company_id`).
- [x] Form Requests con validación de unicidad por empresa (`StoreCustomerRequest`, `UpdateCustomerRequest`).
- [x] Endpoints CRUD y búsqueda rápida `/api/v1/customers/search?q=...`.
- [x] Conexión completa de `src/pages/Customers.tsx`.
- [x] **Tests Automatizados**: 19 pruebas passing (`CustomerApiTest`).

### ✅ Fase 5: POS Transaccional, Turnos de Caja y Pagos
- [x] Migración `cash_sessions` y `cash_movements` (apertura, saldo inicial, ingresos, retiros, arqueo, cierre con diferencias).
- [x] Migración `sales`, `sale_items`, `payments` (ventas, detalle de ítems, totales, descuentos, impuestos).
- [x] Servicio transaccional `SaleService` y `CashService` atómicos (descuento de stock en kardex, consecutivo oficial y caja).
- [x] Endpoints `/api/v1/cash-sessions/*` y `/api/v1/sales/*`.
- [x] Conexión de `src/pages/POS.tsx`, `src/pages/Cash.tsx` e `src/pages/Invoices.tsx`.
- [x] **Tests Automatizados**: 20 pruebas passing (`CashSessionApiTest` + `SaleApiTest`).

### ✅ Fase 6: Dashboard, Reportes & Configuración Global del MVP
- [x] Endpoints `/api/v1/dashboard/stats` y `/api/v1/reports/summary`.
- [x] Endpoints `/api/v1/company` (lectura y edición de datos fiscales y prefijo).
- [x] Endpoints `/api/v1/users` (CRUD de personal por rol y permisos).
- [x] Endpoint `/api/v1/audit/logs` (bitácora unificada de actividad).
- [x] Conexión completa de `src/pages/Dashboard.tsx`, `src/pages/Reports.tsx`, `src/pages/Config.tsx`, `src/pages/Users.tsx`, `src/pages/Audit.tsx`.
- [x] **Tests Automatizados**: 10 pruebas passing (`DashboardApiTest`, `CompanyApiTest`, `UserApiTest`).

### ✅ Fase 7: SuperAdmin, Gestión de Empresas & Perfil de Usuario
- [x] **Rol `superadmin`**: usuario de plataforma sin empresa asignada (`company_id = null`), capaz de gestionar todos los tenants del sistema.
- [x] Comando `php artisan zentry:create-admin` actualizado: crea un `superadmin` global (sin `--company`) con `role = 'superadmin'`.
- [x] Endpoints exclusivos `role:superadmin`:
  - `GET /api/v1/superadmin/dashboard` — KPIs agregados del sistema.
  - CRUD de empresas: `GET/POST /api/v1/companies`, `PUT/DELETE /api/v1/companies/{company}`.
  - Gestión de usuarios por empresa: `GET/POST /api/v1/companies/{company}/users`, `PUT/DELETE /api/v1/companies/{company}/users/{user}`.
  - `GET /api/v1/companies/{company}/audit` — auditoría por empresa.
- [x] Endpoint `POST /api/v1/auth/profile` (todos los roles): actualiza nombre, email, teléfono y foto de perfil.
- [x] `src/pages/SuperAdmin.tsx`: panel completo de gestión del sistema — KPIs, CRUD de empresas, usuarios por empresa, panel de auditoría por empresa.
- [x] `src/pages/Roles.tsx`: vista estática de la matriz de permisos de los roles (`admin`, `cashier`, `inventory`).
- [x] `src/pages/Profile.tsx`: formulario de edición del perfil personal del usuario autenticado (nombre, email, teléfono, foto).
- [x] `src/components/CompanyAuditPanel.tsx`: componente reutilizable de auditoría por empresa con filtro de fechas.

---

### ☁️ Fase 8: Despliegue en la Nube con Supabase y VPS (Fase Post-MVP)
- [ ] Configurar variables de conexión en Supabase y desplegar en producción.

---

*Última actualización: 31 de Octubre de 2026 — Zentry POS Core Team.*
