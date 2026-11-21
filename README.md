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
  pages/      # Páginas de la aplicación
  providers/  # Providers de contexto (AppProvider, AuthProvider, …)
  lib/        # Utilidades y helpers
```

## Flujo de contribución

1. Crear issue en el repo.
2. Crear rama desde `dev`: `feat/N-descripcion-corta`.
3. Implementar cambios con commits convencionales.
4. Abrir PR a `dev` asociando el issue.
5. El PR debe pasar `Build & test` (CI).
6. Revisión y merge a `dev`.
