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
RUN npm install

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

# Instala todas as dependências
RUN npm install

# Copia todo código do backend
COPY backend/ ./

# Gera cliente Prisma
RUN npx prisma generate

# Remove dependências de desenvolvimento para produção
RUN npm prune --omit=dev

# ============================================
# ESTÁGIO 3: Imagem Final com Nginx
# ============================================
FROM nginx:alpine

# Instala Node.js 20, OpenSSL e outras dependências necessárias
RUN apk add --no-cache nodejs npm openssl curl bash procps && \
    node --version && \
    npm --version

# Cria usuário não-root para segurança
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Cria diretório de trabalho
WORKDIR /app

# Copia o backend buildado (mantém estrutura de diretórios)
COPY --from=backend-builder --chown=appuser:appgroup /app /app/backend

# Copia o frontend buildado para o Nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia script de inicialização
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Cria diretório para logs com permissões corretas
RUN mkdir -p /var/log && \
    touch /var/log/backend.log && \
    chown appuser:appgroup /var/log/backend.log && \
    mkdir -p /var/run && \
    chown appuser:appgroup /var/run

# Ajusta permissões do Nginx
RUN chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid

# Expõe porta 80 (Nginx serve tudo)
EXPOSE 80

# Health check mais robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost/health || exit 1

# Muda para usuário não-root
USER appuser

# Comando de inicialização
CMD ["/app/start.sh"]
