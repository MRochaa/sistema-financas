# ============================================
# ESTÁGIO 1: Build do Frontend React
# ============================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copia e instala dependências do frontend
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm ci && cd frontend && npm ci

# Copia código do frontend e builda
COPY . ./
WORKDIR /app/frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:18-alpine AS backend-builder

# Instala dependências necessárias para o Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat python3 make g++

WORKDIR /app

# Copia e instala dependências do backend
COPY backend/package*.json ./
RUN npm ci

# Copia código do backend
COPY backend/ ./

# Gera cliente Prisma e remove devDependencies
RUN npx prisma generate && npm prune --production

# ============================================
# ESTÁGIO 3: Imagem Final com Nginx
# ============================================
FROM nginx:alpine

# Instala Node.js, OpenSSL e outras dependências
RUN apk add --no-cache nodejs npm openssl curl bash

# Cria diretório de trabalho
WORKDIR /app

# Copia o backend buildado
COPY --from=backend-builder /app /app/backend

# Copia o frontend buildado para o Nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia script de inicialização
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expõe porta 80 (Nginx serve tudo)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
CMD ["/app/start.sh"]
