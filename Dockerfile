# ============================================
# ESTÁGIO 1: Instalação de dependências
# ============================================
FROM node:18-alpine AS deps

# Instala OpenSSL e outras dependências necessárias para o Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat python3 make g++

WORKDIR /app

# Copia arquivos de dependências do backend
COPY backend/package*.json ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm ci

# ============================================
# ESTÁGIO 2: Build da aplicação
# ============================================
FROM node:18-alpine AS builder

# Instala OpenSSL para o Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copia dependências instaladas do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia todo o código do backend
COPY backend/ ./

# Gera o cliente Prisma
RUN npx prisma generate

# Remove devDependencies para reduzir tamanho
RUN npm prune --production

# ============================================
# ESTÁGIO 3: Imagem final de produção
# ============================================
FROM node:18-alpine AS runner

# Instala OpenSSL, curl (para healthcheck) e bash
RUN apk add --no-cache openssl curl bash

WORKDIR /app

# Cria grupo e usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copia arquivos necessários do estágio de build
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Copia outros arquivos importantes se existirem
COPY --from=builder --chown=nodejs:nodejs /app/.env* ./

# Copia o script de inicialização
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./

# Torna o script executável
RUN chmod +x docker-entrypoint.sh

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Expõe a porta da aplicação
EXPOSE 3001

# Health check para verificar se a aplicação está rodando
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Muda para usuário não-root
USER nodejs

# Script de entrada que executa migrations e inicia a app
ENTRYPOINT ["./docker-entrypoint.sh"]
