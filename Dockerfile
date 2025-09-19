# ============================================
# ESTÁGIO 1: Instalação de dependências
# ============================================
FROM node:18-alpine AS deps

# Instala OpenSSL e outras dependências necessárias para o Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat python3 make g++

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

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
COPY . .

# Gera o cliente Prisma
RUN npx prisma generate

# Build da aplicação (ajuste se não for Next.js)
RUN npm run build

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
    adduser -S nextjs -u 1001

# Copia arquivos necessários do estágio de build
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copia a build da aplicação (ajuste conforme seu framework)
# Para Next.js:
COPY --from=builder /app/.next ./.next
# Para Node.js puro ou Express:
# COPY --from=builder /app/dist ./dist
# ou
# COPY --from=builder /app/build ./build

# Copia o script de inicialização
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./

# Torna o script executável
RUN chmod +x docker-entrypoint.sh

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Expõe a porta da aplicação
EXPOSE 3000

# Muda para usuário não-root
USER nextjs

# Script de entrada que executa migrations e inicia a app
ENTRYPOINT ["./docker-entrypoint.sh"]
