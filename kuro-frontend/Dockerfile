# Etapa 1: Construcci3n (Build)
FROM node:22-alpine AS builder
WORKDIR /app

# Copiar dependencias e instalarlas primero (aprovecha el cach9 de Docker)
COPY package*.json ./
RUN npm ci

# Copiar el resto del c3digo y compilar
COPY . .

# En Docker levantaremos SSR con Node adapter (soporta rutas din1micas como /producto/[slug])
ENV ASTRO_ADAPTER=node
RUN npm run build

# Etapa 2: Servidor Node (Astro SSR)
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD ["node", "./dist/server/entry.mjs"]
