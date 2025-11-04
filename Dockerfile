# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia arquivos de dependências do frontend
COPY frontend/package*.json ./

# Instala TODAS as dependências incluindo devDependencies
RUN npm install

# Copia o código do frontend
COPY frontend/ ./

# Build do frontend para produção
RUN npm run build

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Instala openssl para o Prisma funcionar corretamente
RUN apk add --no-cache openssl

# Copia arquivos de dependências do backend
COPY backend/package*.json ./

# Instala dependências do backend
RUN npm install

# Copia o código do backend
COPY backend/ ./

# Gera o Prisma Client
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# ============================================
# ESTÁGIO 3: Imagem Final de Produção
# ============================================
FROM node:20-alpine

# Instala nginx, openssl e ferramentas necessárias
RUN apk add --no-cache \
    nginx \
    curl \
    bash \
    openssl

# Cria diretórios necessários
RUN mkdir -p \
    /usr/share/nginx/html \
    /var/log/nginx \
    /var/cache/nginx \
    /run/nginx \
    /etc/nginx/http.d

# Copia o frontend buildado
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copia o backend completo com node_modules
COPY --from=backend-builder /app /app/backend

# Copia configurações
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh /start.sh

# Permissões de execução
RUN chmod +x /start.sh

# Define diretório de trabalho
WORKDIR /app/backend

# Variáveis de ambiente
ENV NODE_ENV=production
ENV BACKEND_PORT=3001

# Porta principal (Nginx)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["/start.sh"]
