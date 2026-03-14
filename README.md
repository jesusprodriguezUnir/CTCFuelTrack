# CTC FuelTrack - Veolia

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)

**CTCFuelTrack** es un sistema integral para la gestión de inventario de gasoil y el monitoreo de consumos de maquinaria pesada distribuida en distintos centros operativos de Veolia España.

Esta plataforma proporciona una interfaz web unificada para operarios y un servicio backend capaz de comunicarse (mediante un API puente) con el hardware de los surtidores físicos, registrando automáticamente los consumos y previniendo repostajes anómalos.

---

## 🚀 Características Principales

- 🔐 **Autenticación Segura (Supabase Auth)**: Registro y acceso seguro para operarios, integrado con políticas de seguridad de base de datos (RLS) para garantizar la privacidad de los datos de Veolia.
- 🏭 **Gestión de Centros y Maquinaria**: Control de máquinas distribuidas por centro, con validación estricta de la capacidad del depósito.
- ⛽ **Doble Vía de Registro**:
  - **Manual (TPV)**: Interfaz responsiva donde el operario introduce la máquina y los litros.
  - **Automático (API)**: Endpoint diseñado para recibir solicitudes de surtidores físicos.
- 🛡️ **Prevención de Fraude/Error**: Lógica en frontend y backend que bloquea cualquier repostaje que exceda la capacidad técnica del depósito de la máquina seleccionada.
- 📊 **Dashboard en Tiempo Real**: Visualización del inventario y las extracciones recientes.

---

## 🛠️ Stack Tecnológico

**Frontend:**
- [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

**Backend:**
- [Python 3.1x](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Uvicorn](https://www.uvicorn.org/)

**Base de Datos & Auth:**
- [Supabase](https://supabase.com/) (PostgreSQL + GoTrue Auth)

**Testing:**
- [Vitest](https://vitest.dev/) + React Testing Library (Frontend)
- [Pytest](https://docs.pytest.org/) (Backend)

---

## ⚙️ Arquitectura del Sistema

1. **Surtidor Físico**: Al finalizar un repostaje, envía una petición `POST` con los litros y el código de la máquina al *Backend Bridge*.
2. **Backend Bridge (FastAPI)**: Valida la petición (comprueba el surtidor, la existencia de la máquina y que no se supere la capacidad del tanque). Si es válido, lo inserta en Supabase.
3. **App Frontend (React)**: Permite a los operarios autenticados dar de alta maquinaria manual y registrar repostajes análogos (tipo TPV), visualizando las gráficas. Todos los accesos a datos están protegidos por Row Level Security (RLS) en Supabase.

---

## 💻 Instalación y Uso Local

### 1. Preparar la Base de Datos (Supabase)
Conecta tu cuenta de Supabase y despliega el esquema:
1. Ve a la consola de Supabase > **SQL Editor**.
2. Copia y ejecuta el script proporcionado en la raíz del proyecto: `supabase_migration.sql`

### 2. Variables de Entorno
Debes configurar las variables de conexión en ambos entornos.

Crea un archivo `.env` en `frontend/` y en `backend/` con:
```env
# Frontend (en frontend/.env)
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key-publica"

# Backend (en backend/.env)
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_ANON_KEY="tu-anon-key-publica"
```

### 3. Ejecutar el Frontend
```bash
cd frontend
npm install
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### 4. Ejecutar el Backend (Bridge)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
La API estará disponible en `http://localhost:8000`.

### 5. Arranque con comando único (Windows)
Desde la raíz del repositorio puedes levantar frontend + backend con un solo comando:

```powershell
.\scripts\dev.cmd
```

Opcionalmente puedes cambiar puertos:

```powershell
.\scripts\dev.cmd -BackendPort 8001 -FrontendPort 5174
```

---

## 🧪 Pruebas Automatizadas (Testing)

El repositorio incluye suites completas de tests automatizados para validar que las reglas de negocio críticas se cumplan y probar el renderizado de UI.

**Test del Backend (API FastAPI endpoints):**
```bash
cd backend
pip install pytest httpx pytest-mock
pytest test_main.py
```

**Test del Frontend (Componentes React / TPV):**
```bash
cd frontend
npm run test
```

---

## ☁️ Despliegue en la Nube (Producción)

Este repositorio ya incluye workflows para GitHub Actions y despliegue automático.

### Flujo recomendado

- Frontend en Vercel (workflow `.github/workflows/deploy-frontend.yml`)
- Backend en Render usando imagen publicada en GHCR (workflow `.github/workflows/build-and-push-backend.yml`)

### Secrets necesarios en GitHub

Configura estos secrets en `Settings > Secrets and variables > Actions`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RENDER_DEPLOY_HOOK_URL` (opcional, para trigger automático de deploy en Render)

### Configuración por servicio

- **Frontend (Recomendado: Vercel / Netlify)**
  1. Conecta tu cuenta de Github.
  2. Selecciona el subdirectorio `frontend/`.
  3. Añade las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  4. Build command: `npm run build` | Output dir: `dist`

- **Backend (Recomendado: Render / Railway)**
  1. Crea un Web Service desde tu Github.
  2. Selecciona el subdirectorio `backend/`.
  3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  4. Entorno de ejecución: Python 3.1x. No olvides configurar las variables `.env`.

---
*Desarrollado para la optimización y el rastreo de combustible en Veolia España.*

---

## 🔁 Despliegue rápido (archivos añadidos)

- **`.gitignore`**: Ignora `node_modules`, entornos virtuales y `.env`.
- **`.env.example`** y **`frontend/.env.example`**: ejemplos para no subir credenciales.
- **`netlify.toml`**: configuración opcional para desplegar `frontend/` en Netlify (build + SPA redirect).
- **`backend/Dockerfile`**: Dockerfile básico para desplegar el backend FastAPI en servicios que acepten contenedores.

Pasos recomendados:
1. Renombra los ejemplos `.env.example` a `.env` y rellena las claves.
2. Haz commit y sube el repo a GitHub.
3. Configura los `secrets` en GitHub Actions.
4. Despliega el frontend en Vercel y vincula el proyecto con tu repositorio.
5. Crea el servicio backend en Render y añade el `Deploy Hook URL` como secret.
6. Haz push a `main` para activar CI y despliegue automático.
