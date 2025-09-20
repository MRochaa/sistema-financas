# ============================================
# ESTÁGIO 1: Build do Frontend React
# ============================================
FROM node:20-alpine AS frontend-builder

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de configuração do frontend
COPY frontend/package*.json ./frontend/

# Instala dependências do frontend
WORKDIR /app/frontend
RUN npm ci || npm install

# Copia código do frontend
WORKDIR /app
COPY frontend/ ./frontend/

# Build do frontend
WORKDIR /app/frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:20-alpine AS backend-builder

# Instala dependências do sistema necessárias para o Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat python3 make g++

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de configuração do backend
COPY backend/package*.json ./

# Instala todas as dependências (incluindo dev para gerar Prisma)
RUN npm ci || npm install

# Copia todo código do backend
COPY backend/ ./

# Gera cliente Prisma
RUN npx prisma generate

# Remove dependências de desenvolvimento
RUN npm prune --omit=dev

# ============================================
# ESTÁGIO 3: Imagem Final com Nginx
# ============================================
FROM nginx:alpine

# Instala Node.js 20, OpenSSL e outras dependências necessárias
RUN apk add --no-cache nodejs npm openssl curl bash && \
    node --version && \
    npm --version

# Cria diretório de trabalho
WORKDIR /app

# Copia o backend buildado (mantém estrutura de diretórios)
COPY --from=backend-builder /app /app/backend

# Copia o frontend buildado para o Nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia script de inicialização
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Cria diretório para logs
RUN mkdir -p /var/log && touch /var/log/backend.log

# Expõe porta 80 (Nginx serve tudo)
EXPOSE 80

# Health check mais tolerante para o startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
CMD ["/app/start.sh"]
