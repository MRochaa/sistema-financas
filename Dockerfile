# ============================================
# Multi-stage build para otimização
# ============================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Instala dependências de build
RUN apk add --no-cache python3 make g++

# Copia e instala dependências do frontend
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia código e build
COPY . .
RUN npm run build

# Stage 2: Build Backend e preparar Prisma
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Copia dependências do backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia schema do Prisma
COPY backend/prisma ./prisma/

# Gera Prisma Client
RUN npx prisma generate

# Copia código do backend
COPY backend/src ./src/
COPY backend/entrypoint.sh ./entrypoint.sh

# Stage 3: Imagem Final de Produção
FROM node:20-alpine
WORKDIR /app

# Instala ferramentas essenciais
RUN apk add --no-cache \
    curl \
    postgresql-client \
    netcat-openbsd \
    bash \
    && rm -rf /var/cache/apk/*

# Copia frontend buildado
COPY --from=frontend-builder /app/dist ./public

# Copia backend
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/src ./src
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/package*.json ./
COPY --from=backend-builder /app/entrypoint.sh ./entrypoint.sh

# Permissões no entrypoint
RUN chmod +x ./entrypoint.sh

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Expõe a porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Inicia aplicação
ENTRYPOINT ["./entrypoint.sh"]
