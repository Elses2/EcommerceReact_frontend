# EcommerceReact_frontend

React + Vite + TypeScript frontend for the EcommerceReact migration (separación del monolito MiEcommerce).

## Stack

- **Vite** + **React** + **TypeScript** (strict)
- **react-router-dom** para routing
- **Tailwind CSS v4** para estilos
- **Vitest** para tests unitarios
- **Playwright** para e2e (tests pendientes, llegan en F6)

## Requisitos

- Node >= 22
- npm >= 11

## Instalación

```bash
npm install
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Type-check + build de producción (`dist/`) |
| `npm run test` | Ejecuta tests unitarios con Vitest |
| `npm run lint` | Ejecuta ESLint |
| `npm run e2e` | Ejecuta Playwright e2e tests |

## Desarrollo contra el backend

En desarrollo, las llamadas a `/api` se proxyan al backend local mediante Vite.
La URL del proxy se configura con la variable de entorno `VITE_API_PROXY_URL` (por defecto `http://localhost:3000`).

```bash
VITE_API_PROXY_URL=http://localhost:3000 npm run dev
```

## Estructura

```
src/
  atoms/      # Componentes atómicos (Button, Badge, …)
  molecules/  # Componentes moleculares (SearchBar, …)
  organisms/  # Componentes organismos (Header, Footer, …)
  components/ # Componentes compartidos (RequireAuth, …)
  pages/      # Páginas de la aplicación (Login, Register, …)
  providers/  # Providers de contexto (AppProvider, AuthProvider, …)
  lib/        # Utilidades y helpers (api client, validation)
```

## Autenticación

El flujo de autenticación se implementa con:

- **API client** (`src/lib/api.ts`): wrapper sobre `fetch` con `credentials: "same-origin"` y rutas relativas `/api/…`. Maneja errores 401 (redirige a `/login?next=`), 400 con errores por campo y errores de red.
- **AuthProvider** (`src/providers/AuthProvider.tsx``): contexto que resuelve la sesión vía `GET /api/auth/me` en el montaje, expone `login`, `register` y `logout`.
- **RequireAuth** (`src/components/RequireAuth.tsx`): guard de ruta que redirige a invitados a `/login?next=<ruta>` y no renderiza hijos hasta que la autenticación se resuelva.
- **Páginas Login y Register**: formularios con validación cliente (spec §6.3) y errores del backend mostrados por campo.

## Flujo de contribución

1. Crear issue en el repo.
2. Crear rama desde `dev`: `feat/N-descripcion-corta`.
3. Implementar cambios con commits convencionales.
4. Abrir PR a `dev` asociando el issue.
5. El PR debe pasar `Build & test` (CI).
6. Revisión y merge a `dev`.
