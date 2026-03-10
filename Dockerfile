# Build stage (imagen completa por compatibilidad con Prisma)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copiar dependencias y Prisma (postinstall necesita el schema)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Generar Prisma Client (ya se hace en postinstall, pero por si acaso)
RUN npx prisma generate

# Copiar código y compilar
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Runtime stage
FROM node:20-bookworm-slim AS runner

# Librerías necesarias para el Prisma query engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar Prisma primero (postinstall lo necesita)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Solo dependencias de producción
RUN npm ci --omit=dev

# Copiar build
COPY --from=builder /app/dist ./dist

# Puerto
EXPOSE 3001

# Migraciones y arranque
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
