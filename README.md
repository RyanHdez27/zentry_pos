<h1 align="center">
  <br>
  🧾 Zentry POS
  <br>
</h1>

<p align="center">
  Sistema de Punto de Venta moderno, multi-tenant y basado en web.<br/>
  Construido con <strong>React + Vite</strong> en el frontend y <strong>Laravel 12</strong> en el backend, todo orquestado con <strong>Docker</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
- [Variables de Entorno](#-variables-de-entorno)
- [API Endpoints](#-api-endpoints)
- [Licencia](#-licencia)

---

## 📖 Descripción

**Zentry POS** es una aplicación web de Punto de Venta diseñada para negocios que requieren gestión completa de ventas, inventario, clientes y reportes. Su arquitectura multi-tenant permite que múltiples empresas operen de forma aislada sobre la misma instancia.

---

## ✨ Características

| Módulo | Descripción |
|---|---|
| 🖥️ **POS** | Terminal de ventas interactivo con búsqueda de productos y carrito |
| 📊 **Dashboard** | Panel principal con métricas y gráficas en tiempo real |
| 📦 **Productos** | Catálogo completo con detalle, categorías y gestión de precios |
| 🗃️ **Inventario** | Control de stock y registro de movimientos |
| 👥 **Clientes** | CRM básico con historial de compras y detalle por cliente |
| 💰 **Caja** | Apertura, cierre y control de sesiones de caja |
| 🧾 **Facturas** | Generación y consulta de comprobantes de venta |
| 📈 **Reportes** | Gráficas de ventas, productos más vendidos y análisis de datos |
| 👤 **Usuarios y Roles** | Gestión de acceso con roles y permisos |
| ⚙️ **Configuración** | Ajustes de empresa y preferencias del sistema |
| 🔍 **Auditoría** | Registro de actividad del sistema |

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** (build tool)
- **Tailwind CSS v4**
- **Recharts** (gráficas)
- **Lucide React** (iconos)

### Backend
- **Laravel 12** (PHP 8.2+)
- **Laravel Sanctum** (autenticación via tokens)
- **PostgreSQL 16** (base de datos)
- API RESTful versionada bajo `/api/v1`

### Infraestructura
- **Docker** + **Docker Compose**
- Arquitectura multi-tenant lista para producción

---

## 📁 Estructura del Proyecto

```
zentry_pos/
├── src/                        # Frontend React
│   ├── components/
│   │   └── Layout.tsx          # Layout principal con navegación
│   ├── pages/
│   │   ├── Dashboard.tsx       # Panel principal
│   │   ├── POS.tsx             # Terminal de punto de venta
│   │   ├── Products.tsx        # Catálogo de productos
│   │   ├── ProductDetail.tsx   # Detalle de producto
│   │   ├── Inventory.tsx       # Gestión de inventario
│   │   ├── Customers.tsx       # Gestión de clientes
│   │   ├── Cash.tsx            # Control de caja
│   │   ├── Invoices.tsx        # Facturas y ventas
│   │   ├── Reports.tsx         # Reportes y análisis
│   │   ├── Users.tsx           # Gestión de usuarios
│   │   ├── Roles.tsx           # Roles y permisos
│   │   ├── Config.tsx          # Configuración del sistema
│   │   ├── Audit.tsx           # Auditoría
│   │   └── Login.tsx           # Autenticación
│   ├── App.tsx                 # Componente raíz y enrutamiento
│   ├── main.tsx                # Punto de entrada
│   └── index.css               # Estilos globales + Tailwind
│
├── backend/                    # Backend Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   │   └── AuthController.php
│   │   └── Models/
│   │       ├── User.php
│   │       └── Company.php
│   ├── routes/
│   │   └── api.php             # Rutas API versionadas
│   └── ...
│
├── docker-compose.yml          # Orquestación de servicios
├── .env.example                # Plantilla de variables de entorno
├── package.json                # Dependencias del frontend
└── vite.config.ts              # Configuración de Vite
```

---

## ✅ Requisitos Previos

Asegúrate de tener instalado lo siguiente:

- [Node.js](https://nodejs.org/) `>= 20`
- [pnpm](https://pnpm.io/) `>= 9` → `npm install -g pnpm`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para el backend y la base de datos)
- [PHP](https://www.php.net/) `>= 8.2` + [Composer](https://getcomposer.org/) *(solo si no usas Docker para el backend)*

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/RyanHdez27/zentry_pos.git
cd zentry_pos
```

### 2. Configurar variables de entorno

```bash
# En la raíz del proyecto
copy .env.example .env
```

Edita el `.env` con tus valores (ver sección [Variables de Entorno](#-variables-de-entorno)).

### 3. Levantar Backend y Base de Datos (Docker)

```bash
docker-compose up -d
```

Esto levantará:
- **PostgreSQL** en el puerto `5432`
- **Backend Laravel** en el puerto `8000`

> La primera vez, Docker construirá la imagen del backend automáticamente.

### 4. Instalar dependencias del Frontend

```bash
pnpm install
```

### 5. Iniciar el servidor de desarrollo del Frontend

```bash
pnpm dev
```

El frontend estará disponible en: **http://localhost:8443**

---

## 🔑 Variables de Entorno

El archivo `.env.example` en la raíz del proyecto contiene todas las variables necesarias:

```env
APP_NAME="Zentry POS"
APP_ENV=local
APP_KEY=                        # Se genera automáticamente en el backend
APP_DEBUG=true
APP_URL=http://localhost:8000

# Puertos Docker
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

# URL de la API (consumida por el frontend)
VITE_API_URL=http://localhost:8000/api/v1
```

> ⚠️ **Nunca subas tu archivo `.env` al repositorio.** Está incluido en `.gitignore`.

---

## 🌐 API Endpoints

Base URL: `http://localhost:8000/api/v1`

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| `GET` | `/health` | Estado del servidor y la base de datos | No |
| `POST` | `/auth/login` | Iniciar sesión | No |
| `GET` | `/auth/me` | Obtener usuario autenticado | Sanctum |
| `POST` | `/auth/logout` | Cerrar sesión | Sanctum |

---

## 📄 Licencia

Este proyecto es propiedad de **Trama Tech**. Todos los derechos reservados.

---

<p align="center">
  Hecho con ❤️ por el equipo de <strong>Trama Tech</strong>
</p>
