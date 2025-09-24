# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia arquivos de dependências
COPY frontend/package*.json ./frontend/

# Instala dependências incluindo devDependencies para build
WORKDIR /app/frontend
RUN npm install

# Copia todos os arquivos do frontend
WORKDIR /app
COPY frontend/ ./frontend/

# Build do frontend (Vite + Tailwind)
WORKDIR /app/frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Build com verbose para debug
RUN echo "Building frontend with VITE_API_URL=${VITE_API_URL}" && \
    npm run build && \
    echo "Build complete. Checking dist folder:" && \
    ls -la dist/ && \
    ls -la dist/assets/ || echo "No assets folder"

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:20-alpine AS backend-builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci || npm install

COPY backend/ ./
RUN npx prisma generate
RUN npm prune --production

# ============================================
# ESTÁGIO 3: Imagem Final
# ============================================
FROM node:20-alpine

# Instala nginx e ferramentas
RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    openssl \
    libc6-compat

# Cria diretórios
RUN mkdir -p \
    /var/log/nginx \
    /var/cache/nginx \
    /var/run/nginx \
    /usr/share/nginx/html \
    /etc/nginx/http.d

# Copia backend
COPY --from=backend-builder /app /app/backend

# Copia frontend BUILD (importante: toda a pasta dist)
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Lista conteúdo para debug
RUN echo "Frontend files:" && \
    ls -la /usr/share/nginx/html/ && \
    echo "Assets:" && \
    ls -la /usr/share/nginx/html/assets/ || echo "No assets"

# Copia configurações
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh /start.sh

RUN chmod +x /start.sh

WORKDIR /app/backend

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["/bin/bash", "/start.sh"]
