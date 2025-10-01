# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Instala dependências de build
RUN apk add --no-cache python3 make g++ git

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production --ignore-scripts || npm install --only=production

# Copia código fonte
COPY . .

# Build do frontend
RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Instala dependências necessárias
RUN apk add --no-cache python3 make g++ git openssl

# Copia package.json do backend
COPY backend/package*.json ./

# Instala dependências do backend
RUN npm ci --only=production --ignore-scripts || npm install --only=production

# Copia schema do Prisma
COPY backend/prisma ./prisma/

# Gera Prisma Client
RUN npx prisma generate

# Copia código do backend
COPY backend/src ./src/
COPY backend/entrypoint.sh ./entrypoint.sh

# ============================================
# Stage 3: Production Image
# ============================================
FROM node:20-alpine

WORKDIR /app

# Instala ferramentas necessárias
RUN apk add --no-cache \
    curl \
    bash \
    postgresql-client \
    netcat-openbsd \
    openssl \
    && rm -rf /var/cache/apk/*

# Copia frontend buildado
COPY --from=frontend-builder /app/dist ./public

# Copia backend completo
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/src ./src
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/package*.json ./
COPY --from=backend-builder /app/entrypoint.sh ./entrypoint.sh

# Permissões no entrypoint
RUN chmod +x ./entrypoint.sh

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expõe porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Inicia aplicação
ENTRYPOINT ["./entrypoint.sh"]
