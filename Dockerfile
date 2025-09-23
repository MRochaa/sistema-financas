# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Instala dependências necessárias para build
RUN apk add --no-cache python3 make g++

# Copia arquivos de dependências do frontend
COPY package*.json ./

# Instala dependências do frontend
RUN npm install

# Copia código fonte do frontend
COPY . .

# Executa o build do frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Instala dependências necessárias para o Prisma no Alpine
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    ca-certificates \
    python3 \
    make \
    g++

# Copia arquivos de dependências do backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instala dependências do backend
RUN npm install

# Copia código fonte do backend
COPY backend/ ./

# Gera o Prisma Client
RUN npx prisma generate

# ============================================
# ESTÁGIO 3: Imagem Final de Produção
# ============================================
FROM node:20-alpine

# Instala dependências necessárias para produção
RUN apk add --no-cache \
    curl \
    postgresql-client \
    openssl \
    ca-certificates \
    libc6-compat \
    coreutils \
    bash

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Cria diretórios necessários
WORKDIR /app

# Copia frontend compilado
COPY --from=frontend-builder --chown=nextjs:nodejs /app/dist ./public

# Copia backend compilado
COPY --from=backend-builder --chown=nextjs:nodejs /app ./

# Cria script de healthcheck
# Este script verifica se o servidor está respondendo na porta correta
RUN echo '#!/bin/sh' > /app/healthcheck.sh && \
    echo 'curl -f http://localhost:${PORT:-3000}/health || exit 1' >> /app/healthcheck.sh && \
    chmod +x /app/healthcheck.sh && \
    chown nextjs:nodejs /app/healthcheck.sh

# Define permissões
RUN chown -R nextjs:nodejs /app

# Muda para usuário não-root
USER nextjs

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3000

# Expõe porta 3000
EXPOSE 3000

# HEALTHCHECK CRÍTICO PARA O COOLIFY
# Verifica a cada 30 segundos se o servidor está respondendo
# Aguarda 60 segundos iniciais antes de começar as verificações
# Timeout de 10 segundos para cada verificação
# 3 tentativas antes de considerar unhealthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização direto
CMD ["node", "src/server.js"]
