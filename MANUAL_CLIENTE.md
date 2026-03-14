# Manual de entrega: CTCFuelTrack

**Resumen:**
- **Producto:** CTCFuelTrack — aplicación web para gestión y registro de repostajes de gasoil en maquinaria distribuida.
- **Stack:** Frontend: React 18 + Vite + TypeScript + Tailwind. Backend: FastAPI (Python). DB/Auth: Supabase (Postgres + Auth).

**Contacto de soporte:**
- Equipo técnico: Responsable del proyecto (proveer contacto del equipo si aplica).

**Contenido del documento:**
- **Características funcionales**
- **Arquitectura**
- **Instalación y ejecución local**
- **Variables de entorno**
- **Despliegue en producción**
- **CI / CD**
- **Pruebas**
- **Seguridad y buenas prácticas**
- **Listado de archivos y rutas relevantes**

**Características funcionales**
- Autenticación de operarios mediante Supabase Auth.
- Alta y gestión de maquinaria por centro operativo.
- Registro manual de repostajes (interfaz tipo TPV).
- Endpoint API para recepción automática desde surtidores físicos (Bridge API).
- Validaciones: bloqueo de repostajes que superen la capacidad del depósito.
- Dashboard con consumos recientes e inventario.

**Arquitectura**
- Frontend (SPA) consume la API de backend y Supabase directamente para operaciones cliente-compatibles.
- Backend (FastAPI) hace de puente para validaciones y para inserciones protegidas en Supabase.
- Base de datos y auth gestionados por Supabase; reglas RLS deben estar activas para limitar accesos.

**Instalación y ejecución local**
- Requisitos:
  - Node.js 18+ para frontend
  - Python 3.11+ para backend
  - Cuenta y proyecto Supabase con las tablas y migraciones aplicadas

- Preparación de la DB:
  - Ejecutar el script `supabase_migration.sql` en la consola SQL de Supabase.

- Frontend (local):
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  App disponible en `http://localhost:5173`.

- Backend (local):
  ```bash
  cd backend
  python -m pip install -r requirements.txt
  uvicorn main:app --reload
  ```
  API disponible en `http://localhost:8000`.

**Variables de entorno**
- Archivos de ejemplo añadidos: `./.env.example` y `./frontend/.env.example`.
- Variables necesarias:
  - Frontend (`frontend/.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
  - Backend (`backend/.env` o raíz): `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
  - (Opcional, solo backend) `SUPABASE_SERVICE_ROLE_KEY` para operaciones privilegiadas — mantenerla secreta.

**Despliegue en producción**
- Frontend (opciones recomendadas): Vercel, Netlify o GitHub Pages.
  - Build command: `npm run build` (desde `frontend/`). Output: `frontend/dist`.
  - Si se usa GitHub Pages, el workflow `deploy-frontend.yml` ya publica `frontend/dist` a `gh-pages`.

- Backend (opciones recomendadas): Render, Railway, Fly.io o contenedor en cualquier proveedor.
  - `backend/Dockerfile` incluido para desplegar como contenedor.
  - Start command en PaaS: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
  - El repositorio contiene workflow para construir y publicar la imagen en GHCR: `.github/workflows/build-and-push-backend.yml`.

**CI / CD**
- `CI` workflow (`.github/workflows/ci.yml`) ejecuta tests frontend y backend en push/PR.
- `deploy-frontend.yml` despliega `frontend/dist` a GitHub Pages en `main`.
- `build-and-push-backend.yml` construye y publica la imagen del backend en GHCR; se adaptó para generar tags en minúsculas y localizar `Dockerfile`.

**Pruebas**
- Backend: `pytest` (archivo de pruebas ejemplo en `backend/test_main.py`).
  ```bash
  cd backend
  pip install -r requirements.txt
  pip install pytest
  pytest
  ```
- Frontend: `vitest`
  ```bash
  cd frontend
  npm ci
  npm run test
  ```

**Seguridad y buenas prácticas**
- Nunca subir archivos `.env` con credenciales. Usar `secrets` en GitHub para las variables sensibles.
- Usar la `anon key` en el frontend (clave pública) y mantener las `service role` solo en backend.
- Revisar y activar Row Level Security (RLS) en Supabase para garantizar accesos mínimos.

**Soporte y mantenimiento**
- Actualizaciones:
  - Dependencias frontend: actualizar `package.json` y ejecutar `npm audit` periódicamente.
  - Dependencias backend: mantener `requirements.txt` actualizado y revisar vulnerabilidades.
- Backups: configurar backups periódicos para la base de datos en Supabase.

**Listado de archivos y rutas relevantes**
- `frontend/` — código cliente (React + Vite)
- `frontend/package.json` — scripts y deps frontend
- `frontend/.env.example` — variables frontend (VITE_*)
- `backend/` — API FastAPI
- `backend/requirements.txt` — deps Python
- `backend/Dockerfile` — Dockerfile para backend
- `backend/test_main.py` — tests backend ejemplo
- `supabase_migration.sql` — script de migración/DB
- `.github/workflows/ci.yml` — CI tests
- `.github/workflows/deploy-frontend.yml` — deploy frontend a Pages
- `.github/workflows/build-and-push-backend.yml` — build/push GHCR
- `README.md` — instrucciones de uso y despliegue rápidas

**Entrega y handover**
1. Proveer acceso a la organización/repo en GitHub y habilitar `Actions` y `Packages` si procede.
2. Proveer las claves `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para entornos (agregarlas como GitHub Secrets o en panel del host del frontend).
3. Para producción, crear un servicio en Render/Railway o habilitar GHCR y desplegar el contenedor del backend.

**Anexos**
- Incluir credenciales, URLs y contactos en documento separado y seguro (no dentro del repo).

---
Fecha de generación: 2026-03-14
