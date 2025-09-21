# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia apenas package files primeiro (cache de camadas)
COPY frontend/package*.json ./frontend/

# Instala dependências do frontend
WORKDIR /app/frontend
# Instalando TODAS as dependências (incluindo devDependencies como o Vite)
RUN npm install

# Copia código fonte do frontend
WORKDIR /app
COPY frontend/ ./frontend/

# Build do frontend
WORKDIR /app/frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Build do Backend  
# ============================================
FROM node:20-alpine AS backend-builder

# Instala dependências do sistema para Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copia package files
COPY backend/package*.json ./

# Instala TODAS as dependências (necessário para Prisma)
RUN npm install

# Copia código do backend
COPY backend/ ./

# Gera Prisma client
RUN npx prisma generate

# Remove devDependencies para produção
RUN npm prune --production

# ============================================
# ESTÁGIO 3: Imagem Final
# ============================================
FROM node:20-alpine

# Instala dependências necessárias
RUN apk add --no-cache \
    nginx \
    curl \
    bash \
    openssl \
    && rm -rf /var/cache/apk/*

# Cria diretórios necessários
WORKDIR /app
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run

# Copia backend do estágio de build
COPY --from=backend-builder /app /app/backend

# Copia frontend buildado
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove configuração padrão do Nginx se existir
RUN rm -f /etc/nginx/sites-enabled/default

# Copia e configura script de inicialização
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3001

# Expõe porta 80
EXPOSE 80

# Health check com timeout maior
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
    CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
CMD ["/app/start.sh"]
