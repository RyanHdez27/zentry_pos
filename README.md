<h1 align="center">
  <br>
  🧾 Zentry POS
  <br>
</h1>

<p align="center">
  Sistema SaaS de Punto de Venta (POS) y Gestión Comercial Multi-tenant de alto rendimiento.<br/>
  Construido con <strong>React 19 + TypeScript + Tailwind CSS v4</strong> en el frontend y <strong>Laravel 12 + PostgreSQL 16</strong> en el backend.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Tests-99%20Passing-10B981?style=for-the-badge&logo=checkmarx&logoColor=white" />
</p>

---

## 📋 Tabla de Contenidos

- [Descripción y Arquitectura](#-descripción-y-arquitectura)
- [Credenciales de Acceso (Superadmin y Roles)](#-credenciales-de-acceso)
- [Módulos Implementados](#-módulos-implementados)
- [Requisitos Previos](#-requisitos-previos)
- [Guía de Despliegue y Puesta en Marcha](#-guía-de-despliegue-y-puesta-en-marcha)
  - [Opción 1: Despliegue con Docker Compose (Recomendado)](#opción-1-despliegue-con-docker-compose-producción-y-staging)
  - [Opción 2: Desarrollo Local (Sin Docker)](#opción-2-desarrollo-local-sin-docker)
  - [Opción 3: Despliegue en la Nube con Supabase y VPS](#opción-3-despliegue-en-la-nube-con-supabase-y-vps)
  - [Opción 4: Demostración Estática en GitHub Pages](#opción-4-demostración-estática-en-github-pages)
- [Crear tu Propio Usuario Superadministrador](#-crear-tu-propio-usuario-superadministrador)
- [Ejecutar Pruebas Automatizadas](#-pruebas-automatizadas)
- [Variables de Entorno](#-variables-de-entorno)
- [Colección de Endpoints API v1](#-endpoints-de-la-api-v1)
- [Licencia](#-licencia)

---

## 📖 Descripción y Arquitectura

**Zentry POS** es una solución integral diseñada para comercios, cadenas y empresas que necesitan control riguroso de ventas, inventario auditable, turnos de caja y facturación con separación estricta de inquilinos (**Multi-tenancy**).

### Pilares Arquitectónicos:
- **Aislamiento Multi-tenant Estricto:** Cada consulta y mutación está vinculada a nivel de modelo y base de datos con el trait `BelongsToCompany` y el scope global `CompanyScope`. Ninguna empresa puede ver o alterar datos de otra.
- **Transaccionalidad ACID en Ventas:** Registro atómico de ventas, asignación de consecutivo oficial bloqueando el tenant (`lockForUpdate`), descuento de stock en Kardex y conciliación de caja en una única transacción de BD.
- **Auditoría Inmutable (Kardex):** Cada entrada, salida, venta, merma o anulación queda registrada con existencias previas, posteriores y costo unitario.
- **Tolerancia a Desconexión / Modo Demo:** El frontend opera de forma fluida conectado a la API de Laravel y cuenta con fallback automático en modo demo para presentaciones offline o previews estáticos.

---

## 👤 Credenciales de Acceso

El sistema cuenta con usuarios pre-configurados para pruebas y validación inmediata:

| Perfil | Rol | Correo Electrónico | Contraseña | Alcance de Permisos |
|---|---|---|---|---|
| 👑 **Carlos Rodríguez (Superadmin)** | `admin` | `carlos@zentrypos.com` | `password123` | **Acceso total:** POS, Caja, Inventario, Clientes, Facturas, Reportes, Personal, Configuración y Auditoría |
| 💼 **María González** | `cashier` | `maria@zentrypos.com` | `password123` | POS, Turnos y movimientos de caja, Historial de facturas y Clientes |
| 📦 **Juan Pérez** | `inventory` | `juan@zentrypos.com` | `password123` | Catálogo de productos, Categorías, Existencias, Ajustes manuales y Kardex |

> 💡 **Acceso rápido:** En la pantalla de Login puedes hacer clic en **"Explorar Demo Interactivo"** para ingresar de inmediato con perfil de Administrador sin digitar credenciales.

---

## ✨ Módulos Implementados

| Módulo | Funcionalidades Clave |
|---|---|
| 🖥️ **Terminal POS** | Búsqueda reactiva, lector de código de barras, selección de cliente registrado o consumidor final, carrito dinámico, cobro multipago (efectivo, tarjeta, transferencia, crédito) y emisión con consecutivo oficial. |
| 💰 **Caja & Turnos** | Apertura con fondo base, registro de ingresos/retiros manuales, arqueo ciego, cálculo automático de faltantes/sobrantes y cierre auditado. |
| 🧾 **Facturas & Ventas** | Historial de comprobantes emitidos, consulta detallada con desglose tributario, botón de impresión / PDF y opción de anulación que restituye stock e inventario (exclusivo admin). |
| 📦 **Productos & Precios** | Catálogo con filtros por categoría, búsqueda rápida, código de barras/SKU, costos, precios e impuestos diferenciados. |
| 🗃️ **Inventario & Kardex** | Existencias en tiempo real, alertas de bajo stock, valorización comercial del inventario y bitácora inmutable de movimientos. |
| 👥 **Clientes & CRM** | Directorio de clientes con cupo de crédito autorizado, balance deudor acumulado y búsqueda ultrarrápida para terminal POS. |
| 📊 **Dashboard General** | KPIs en vivo (ventas hoy, mes, ticket promedio, clientes), gráfica de últimos 7 días y alertas de stock mínimo. |
| 📈 **Reportes & Márgenes** | Desglose por periodos de tiempo, márgenes comerciales brutos estimados y rendimiento comparativo por cajero. |
| 👤 **Personal & Roles** | Control de colaboradores, asignación de roles y activación/desactivación de cuentas. |
| ⚙️ **Configuración Fiscal** | Razón social, NIT, moneda (`COP`, `USD`), tasa de IVA y prefijo oficial de facturación (`FV-`). |
| 🔍 **Auditoría del Sistema** | Registro cronológico unificado de acciones críticas con opción de exportación a archivo CSV. |

---

## 🛠️ Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) `>= 24.0`
- [Node.js](https://nodejs.org/) `>= 20.x`
- [pnpm](https://pnpm.io/) `>= 9.x` o npm
- [PHP](https://www.php.net/) `>= 8.2` y [Composer](https://getcomposer.org/) *(solo requerido si ejecutas el backend sin Docker)*

---

## 🚀 Guía de Despliegue y Puesta en Marcha

### Opción 1: Despliegue con Docker Compose (Producción y Staging)

Es la forma más robusta y recomendada. Orquesta PostgreSQL 16 y el backend Laravel con Nginx y PHP-FPM en contenedores optimizados.

#### 1. Clonar el proyecto y preparar entorno
```bash
git clone https://github.com/RyanHdez27/zentry_pos.git
cd zentry_pos

# Copiar variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env
```

#### 2. Levantar los contenedores
```bash
docker compose up -d --build
```

#### 3. Ejecutar migraciones y datos iniciales
```bash
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
```

#### 4. Iniciar el frontend
```bash
pnpm install
pnpm dev
```

- **Frontend:** `http://localhost:8443`
- **Backend API:** `http://localhost:8000/api/v1`
- **PostgreSQL:** `localhost:5432`

---

### Opción 2: Desarrollo Local (Sin Docker)

Ideal para programar localmente de forma ligera utilizando PHP y Node nativos:

#### 1. Configurar y migrar Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Puedes usar SQLite local o tu motor PostgreSQL
php artisan migrate --seed
php artisan serve --port=8000
```

#### 2. Iniciar Frontend
En una nueva terminal, en la raíz del proyecto:
```bash
pnpm install
pnpm dev
```

---

### Opción 3: Despliegue en la Nube con Supabase y VPS

Para desplegar Zentry POS en un entorno productivo en la nube:

1. **Base de Datos (Supabase):**
   - Crea un nuevo proyecto en [Supabase](https://supabase.com).
   - Ve a **Settings > Database** y copia los datos de conexión (**Connection Pooling** o **Direct Connection**).
   - Configura en tu archivo `.env` de producción:
     ```env
     DB_CONNECTION=pgsql
     DB_HOST=aws-0-sa-east-1.pooler.supabase.com
     DB_PORT=6543
     DB_DATABASE=postgres
     DB_USERNAME=postgres.tu-proyecto-id
     DB_PASSWORD=tu-contraseña-segura
     ```
2. **Backend (VPS / Render / DigitalOcean / AWS):**
   - Ejecuta `php artisan migrate --force` para crear las tablas en Supabase.
   - Ejecuta `php artisan db:seed --force` para poblar los catálogos y usuarios iniciales.
3. **Frontend (Vercel / Cloudflare Pages / Netlify):**
   - Configura la variable de entorno `VITE_API_URL=https://api.tudominio.com/api/v1`.
   - Comando de compilación: `npm run build`
   - Directorio de salida: `dist`

---

### Opción 4: Demostración Estática en GitHub Pages

El proyecto incluye un pipeline automatizado de CI/CD mediante **GitHub Actions** (`.github/workflows/deploy.yml`). Cualquier push a la rama `main` compila y publica automáticamente la versión web interactiva lista para clientes en GitHub Pages con soporte de modo demo autónomo.

---

## 👑 Crear tu Propio Usuario Superadministrador

Hemos incorporado un comando Artisan exclusivo para crear tu propia cuenta de Superadministrador con tu nombre y credenciales personales:

```bash
# Dentro del contenedor Docker:
docker compose exec backend php artisan zentry:create-admin

# O en entorno local:
cd backend
php artisan zentry:create-admin --name="Tu Nombre" --email="tu@correo.com" --password="tu_password_segura"
```

El comando registrará el usuario automáticamente con rol `admin` y acceso irrestricto a toda la plataforma.

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con una amplia suite de pruebas unitarias y de integración que garantizan la integridad de la base de datos, el cálculo de arqueos de caja y el aislamiento multi-tenant:

```bash
# Correr tests del backend (99 tests automatizados)
cd backend
php artisan test

# Verificar tipos de TypeScript en el frontend
cd ..
npx tsc --noEmit

# Compilar bundle de producción
npm run build
```

---

## 🔑 Variables de Entorno

Plantilla de variables esenciales en `.env`:

```env
APP_NAME="Zentry POS"
APP_ENV=local
APP_KEY=base64:WuG1ZE7U5jI4FCFeYeMul8whcsdpePDLOrwz4Pozrzs=
APP_DEBUG=true
APP_URL=http://localhost:8000

# Puertos
FORWARD_BACKEND_PORT=8000
FORWARD_DB_PORT=5432
FORWARD_FRONTEND_PORT=8443

# Base de Datos PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=zentry_pos
DB_USERNAME=zentry_user
DB_PASSWORD=secret123

# URL de API para Frontend
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🌐 Endpoints de la API v1

Base URL: `http://localhost:8000/api/v1`

### 🔐 Autenticación
| Método | Endpoint | Descripción | Rol Requerido |
|---|---|---|---|
| `POST` | `/auth/login` | Iniciar sesión y obtener token Bearer | Público |
| `GET` | `/auth/me` | Datos del usuario y empresa en sesión | Autenticado |
| `POST` | `/auth/logout` | Revocar token y cerrar sesión | Autenticado |

### 💰 Caja & Turnos
| Método | Endpoint | Descripción | Rol Requerido |
|---|---|---|---|
| `GET` | `/cash-sessions/current` | Turno de caja abierto, balance y movimientos | Autenticado |
| `POST` | `/cash-sessions/open` | Abrir turno con saldo inicial | `admin`, `cashier` |
| `POST` | `/cash-sessions/{id}/movements` | Registrar ingreso, retiro o gasto | `admin`, `cashier` |
| `POST` | `/cash-sessions/{id}/close` | Arqueo ciego y cierre de turno | `admin`, `cashier` |
| `GET` | `/cash-sessions` | Historial de turnos de caja | Autenticado |

### 🧾 Ventas & POS
| Método | Endpoint | Descripción | Rol Requerido |
|---|---|---|---|
| `GET` | `/sales` | Listado paginado de facturas con filtros | Autenticado |
| `GET` | `/sales/{id}` | Detalle completo de venta, productos y pagos | Autenticado |
| `POST` | `/sales` | Procesar venta atómica en POS con Kardex | `admin`, `cashier` |
| `POST` | `/sales/{id}/cancel` | Anular factura, restituyendo stock y caja | `admin` |

### 📦 Productos & Categorías
| Método | Endpoint | Descripción | Rol Requerido |
|---|---|---|---|
| `GET` | `/products` | Catálogo de productos paginado y filtrable | Autenticado |
| `GET` | `/products/search?q=` | Búsqueda rápida optimizada para POS | Autenticado |
| `POST/PUT/DELETE`| `/products/{id}` | Gestión de productos | `admin`, `inventory` |
| `GET/POST/PUT/DELETE`| `/categories` | Gestión de categorías | `admin`, `inventory` |

### 🗃️ Inventario & Kardex
| Método | Endpoint | Descripción | Rol Requerido |
|---|---|---|---|
| `GET` | `/inventory/summary` | Valorización y alertas de bajo stock | Autenticado |
| `GET` | `/inventory/movements` | Kardex de movimientos auditables | Autenticado |
| `POST` | `/inventory/adjust` | Ajustes manuales (entrada/salida/merma) | `admin`, `inventory` |

### 👥 Clientes (CRM)
| Método | Endpoint | Descripción | Rol Requerido |
|---|---|---|---|
| `GET` | `/customers` | Directorio de clientes con filtros | Autenticado |
| `GET` | `/customers/search?q=` | Selector de cliente rápido para POS | Autenticado |
| `POST/PUT` | `/customers/{id}` | Crear y editar clientes | `admin`, `cashier` |
| `DELETE` | `/customers/{id}` | Eliminación suave de cliente | `admin` |

### 📊 Dashboard, Empresa & Usuarios
| Método | Endpoint | Descripción | Rol Requerido |
|---|---|---|---|
| `GET` | `/dashboard/stats` | KPIs en vivo, gráficas y productos top | Autenticado |
| `GET` | `/reports/summary` | Márgenes comerciales y ventas por cajero | Autenticado |
| `GET/PUT` | `/company` | Consulta y actualización de datos fiscales | `admin` (PUT) |
| `GET/POST/PUT/DELETE` | `/users` | Gestión de personal y colaboradores | `admin` |
| `GET` | `/audit/logs` | Bitácora unificada de eventos críticos | Autenticado |

---

## 📄 Licencia

Este proyecto es propiedad de **Trama Tech**. Todos los derechos reservados.

---

<p align="center">
  Hecho con ❤️ y precisión por el equipo de <strong>Trama Tech</strong>
</p>
