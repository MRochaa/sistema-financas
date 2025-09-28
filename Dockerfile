# ============================================
# Build do Frontend (SEM NODE_ENV=production)
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# CORREÇÃO: Instalar dependências e forçar reinstalação do Rollup
RUN npm ci && \
    npm rebuild && \
    npm install --save-dev @rollup/rollup-linux-x64-musl

# Copia código fonte
COPY index.html ./
COPY public/ ./public/
COPY src/ ./src/

# Build de produção
RUN npm run build && \
    echo "Frontend build concluído:" && \
    ls -la dist/

# ============================================
# Build do Backend
# ============================================
FROM node:20-alpine AS backend-builder

# Dependências do sistema para Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copia e instala dependências
COPY backend/package*.json ./
RUN npm ci

# Copia código fonte
COPY backend/ ./

# Gera Prisma Client
RUN npx prisma generate

# Remove devDependencies
RUN npm prune --production

# ============================================
# Imagem de Produção
# ============================================
FROM node:20-alpine AS production

# Instala runtime dependencies
RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    openssl \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Cria diretórios necessários
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run /usr/share/nginx/html \
    && chown -R nginx:nginx /var/log/nginx /var/cache/nginx /var/run

# Copia backend pronto
COPY --from=backend-builder /app /app/backend

# Copia frontend buildado
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Favicon já está incluído no dist/ copiado acima

# Copia configurações
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh /start.sh

# Permissões
RUN chmod +x /start.sh

# Diretório de trabalho
WORKDIR /app/backend

# Variáveis de ambiente (defaults seguros)
ENV NODE_ENV=production \
    PORT=3001

# Porta exposta
EXPOSE 80

# Healthcheck no Dockerfile (mais confiável que docker-compose)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
CMD ["/start.sh"]
