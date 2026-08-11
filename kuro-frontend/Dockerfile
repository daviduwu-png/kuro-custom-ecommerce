# Etapa 1: Construcci 3n (Build)
FROM node:26-alpine AS builder
WORKDIR /app

# Argumentos de Build para Vite/Astro
ARG PUBLIC_API_URL
ARG PUBLIC_GOOGLE_CLIENT_ID
ARG PUBLIC_STRIPE_PUBLISHABLE_KEY

ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_GOOGLE_CLIENT_ID=$PUBLIC_GOOGLE_CLIENT_ID
ENV PUBLIC_STRIPE_PUBLISHABLE_KEY=$PUBLIC_STRIPE_PUBLISHABLE_KEY

# Copiar dependencias e instalarlas primero (aprovecha el cach 9 de Docker)
COPY package*.json ./
RUN npm ci

# Copiar el resto del c 3digo y compilar
COPY . .

# En Docker levantaremos SSR con Node adapter (soporta rutas din1micas como /producto/[slug])
ENV ASTRO_ADAPTER=node
RUN npm run build

# Etapa 2: Servidor Node (Astro SSR)
FROM node:26-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER 1000

CMD ["node", "./dist/server/entry.mjs"]
