# Kuro Custom - Frontend

Frontend para la plataforma de comercio electrónico Kuro Custom. Implementado en Astro con componentes React para interactividad (catálogo, cuenta, checkout y personalización de productos).

## Tecnologías

- Astro.
- React.
- Tailwind CSS.
- Axios (cliente HTTP).
- Nano Stores (estado global).

## Requisitos

- Node.js 18+ y npm.

## Configuración de entorno

Este proyecto no versiona archivos `.env` reales. Usar el archivo de ejemplo:

```bash
cp .env.example .env
```

Variables públicas esperadas:

- `PUBLIC_API_URL`.
- `PUBLIC_GOOGLE_CLIENT_ID`.
- `PUBLIC_STRIPE_PUBLISHABLE_KEY`.

Nota: las variables `PUBLIC_` se exponen al navegador; no colocar secretos.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abrir `http://localhost:4321`.

## Build

```bash
npm run build
npm run preview
```
