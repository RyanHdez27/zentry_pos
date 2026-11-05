# 🏢 Modelo Multi-tenant — Zentry POS

> Documento de arquitectura y estrategia de despliegue para múltiples empresas clientes.

---

## ¿Qué es multi-tenancy en Zentry POS?

Zentry POS soporta múltiples empresas ("tenants") dentro de un solo sistema. Cada empresa tiene sus propios productos, usuarios, ventas, caja e inventario completamente aislados de las demás.

El aislamiento se garantiza a nivel de base de datos mediante:
- Campo `company_id` en todas las tablas
- Trait `BelongsToCompany` en todos los modelos
- `CompanyScope` global — **ninguna consulta puede cruzar datos entre empresas**

---

## 📐 Dos modelos de despliegue disponibles

### Opción A — SaaS Multi-tenant (recomendado para escalar)

```
┌────────────────────────────────────────────┐
│            Un solo servidor                │
│         (una sola codebase)                │
│                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Empresa  │  │ Empresa  │  │ Empresa  │ │
│  │  Alpha   │  │   Beta   │  │  Gamma   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       └─────────────┴─────────────┘        │
│              Base de datos única           │
│         (aislada por company_id)           │
└────────────────────────────────────────────┘
```

**Características:**
- ✅ Una sola instancia del sistema (un `.env`, un servidor)
- ✅ Actualizar el sistema = todas las empresas actualizadas instantáneamente
- ✅ Costo operativo mínimo
- ✅ Fácil de monitorear y mantener
- ⚠️ Las empresas comparten recursos del servidor (CPU/RAM)
- ⚠️ Requiere disciplina en el aislamiento de datos (ya garantizado por `CompanyScope`)

**Cuándo usar:** Cuando Trama Tech ofrece Zentry POS como servicio en la nube y cobra por empresa/mes.

---

### Opción B — Instancia Dedicada por Cliente (On-Premise / White Label)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Servidor   │    │  Servidor   │    │  Servidor   │
│  Empresa A  │    │  Empresa B  │    │  Empresa C  │
│             │    │             │    │             │
│  .env → A   │    │  .env → B   │    │  .env → C   │
│  BD propia  │    │  BD propia  │    │  BD propia  │
│  Git branch │    │  Git branch │    │  Git branch │
└─────────────┘    └─────────────┘    └─────────────┘
```

**Características:**
- ✅ Cada cliente tiene su propio servidor y base de datos
- ✅ Mayor aislamiento físico (ideal para clientes que exigen privacidad total)
- ✅ Personalización total por cliente (logo, colores, módulos)
- ⚠️ Mayor costo operativo (un servidor por cliente)
- ⚠️ Las actualizaciones requieren despliegue individual en cada instancia

**Cuándo usar:** Cuando el cliente exige que sus datos estén en sus propios servidores, o cuando se vende como producto instalado (licencia perpetua).

---

## 🚀 Cómo incorporar una nueva empresa

### En Opción A (SaaS)

**1. Crear el registro de la empresa en la base de datos:**
```bash
# Conectarse al servidor de producción
docker exec -it zentry-backend bash

# Crear administrador para la nueva empresa
php artisan zentry:create-admin
```

El comando preguntará interactivamente:
```
Nombre de la empresa: Ferretería López S.A.S.
NIT/RUC de la empresa: 900123456-7
Nombre del administrador: Pedro López
Email del administrador: pedro@ferreterialopez.com
Contraseña: [ingresada manualmente]
```

Al finalizar, el sistema:
1. Crea el registro en la tabla `companies`
2. Crea el usuario administrador vinculado a esa empresa
3. Genera las credenciales listas para el cliente

**2. Entregar credenciales al cliente:**
```
URL del sistema: https://app.zentrypos.com
Email: pedro@ferreterialopez.com
Contraseña temporal: [la que se configuró]
```

**3. El cliente configura su empresa desde el panel:**
- Ir a Configuración → Empresa
- Actualizar logo, dirección, prefijo de facturas, tasa de impuesto

---

### En Opción B (Instancia Dedicada)

**1. Crear la rama del cliente:**
```bash
git checkout main
git pull origin main
git checkout -b client/ferreteria-lopez
```

**2. Configurar el `.env` del cliente:**
```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env`:
```env
APP_NAME="Ferretería López POS"
APP_URL=https://pos.ferreterialopez.com

DB_CONNECTION=pgsql
DB_HOST=localhost
DB_DATABASE=ferreteria_lopez_db
DB_USERNAME=ferreteria_user
DB_PASSWORD=contraseña_segura
```

**3. Desplegar:**
```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan zentry:create-admin
php artisan optimize

cd ..
npm run build
# Copiar dist/ al servidor web del cliente
```

**4. Configurar el frontend (si es dominio propio):**
```bash
# En .env.local del frontend
VITE_API_URL=https://api.ferreterialopez.com/api/v1
npm run build
```

---

## 📊 Tabla comparativa

| Criterio | Opción A (SaaS) | Opción B (Dedicada) |
|---|---|---|
| Costo operativo | 💚 Bajo (un servidor) | 🔴 Alto (N servidores) |
| Velocidad de onboarding | 💚 Minutos (un comando) | 🟡 Horas (deploy completo) |
| Actualizaciones | 💚 Automáticas para todos | 🔴 Manual por cliente |
| Aislamiento físico | 🟡 Lógico (company_id) | 💚 Total (servidor propio) |
| Personalización | 🟡 Limitada (config DB) | 💚 Total (código propio) |
| Facturación recurrente | 💚 Fácil (por empresa) | 🟡 Manual por contrato |
| Requiere DevOps | 🟡 Mínimo | 🔴 Por cada cliente |

---

## 🔐 Roles disponibles por empresa

Cada empresa tiene su propio conjunto de usuarios con tres roles operativos. Adicionalmente existe el rol de plataforma `superadmin`:

| Rol | Ámbito | Permisos |
|---|---|---|
| `superadmin` | **Plataforma completa** (sin empresa) | Crear, editar y eliminar empresas; gestionar usuarios de cualquier empresa; ver KPIs del sistema completo |
| `admin` | Empresa propia | Acceso total: usuarios, config, reportes, caja, ventas, inventario |
| `cashier` | Empresa propia | POS, ventas, caja, clientes, facturas, consulta de usuarios |
| `inventory` | Empresa propia | Productos, inventario, categorías (sin acceso a caja ni reportes financieros) |

> **Nota sobre `superadmin`:** este usuario vive sin `company_id` asignado. El `CompanyScope` global no aplica sobre él, lo que le permite consultar y gestionar datos de todos los tenants. Se crea con `php artisan zentry:create-admin` y accede a su propio panel en `src/pages/SuperAdmin.tsx`.

---

## 🛣️ Hoja de ruta para multi-tenancy avanzado (Opción A)

Para el futuro cuando haya múltiples empresas en SaaS:

### Panel de SuperAdmin (✅ implementado)
- [x] Módulo `src/pages/SuperAdmin.tsx` con panel propio del superadmin
- [x] CRUD de empresas desde interfaz web (sin artisan)
- [x] Estadísticas agregadas (ventas totales del sistema, empresas activas) vía `GET /api/v1/superadmin/dashboard`
- [ ] Gestión de planes y facturación por empresa

### Billing por tenant
- [ ] Tabla `subscriptions` con plan, fecha de vencimiento, límite de usuarios
- [ ] Middleware `CheckSubscription` que bloquea acceso si el plan venció
- [ ] Integración con pasarela de pago (PSE / Wompi / Stripe)

### Subdominios por empresa
- [ ] `empresa-a.zentrypos.com` → resuelve a la misma instancia, identifica el tenant por subdominio
- [ ] Middleware `IdentifyTenant` para resolución por subdominio en lugar de por token

---

## 🧪 Validación del sistema multi-tenant

La suite de tests en `backend/tests/` valida el aislamiento de datos con **96 tests (339 assertions)**:

```bash
cd backend
php artisan test
```

Todos los tests crean datos para múltiples empresas y verifican que una empresa no pueda ver los datos de otra.

---

## 📌 Comandos de referencia rápida

```bash
# Onboarding nueva empresa (Opción A - SaaS)
php artisan zentry:create-admin

# Ver lista de empresas registradas
php artisan tinker --execute="echo \App\Models\Company::count() . ' empresas registradas';"

# Crear nueva rama para cliente dedicado (Opción B)
git checkout -b client/nombre-empresa

# Ver ramas de clientes activos
git branch -a | grep "client/"

# Ejecutar tests de aislamiento multi-tenant
php artisan test --testsuite=Feature
```

---

*Documento generado por Trama Tech — Zentry POS v1.0 — 2026*
