# ============================================
# ESTÁGIO 1: Build do Frontend React
# ============================================
FROM node:20-alpine AS frontend-builder

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de configuração do projeto raiz (se existirem)
COPY package*.json ./

# Verifica se existe package-lock.json na raiz e instala dependências
RUN if [ -f "package-lock.json" ]; then \
        npm ci; \
    elif [ -f "package.json" ]; then \
        npm install; \
    fi

# Copia arquivos de configuração do frontend
COPY frontend/package*.json ./frontend/

# Muda para diretório do frontend e instala dependências
WORKDIR /app/frontend
RUN if [ -f "package-lock.json" ]; then \
        npm ci; \
    else \
        npm install; \
    fi

# Volta para raiz e copia todo o código
WORKDIR /app
COPY . ./

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

# Instala dependências do backend
RUN if [ -f "package-lock.json" ]; then \
        npm ci; \
    else \
        npm install; \
    fi

# Copia código do backend
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

# Copia o backend buildado
COPY --from=backend-builder /app /app/backend

# Copia o frontend buildado para o Nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copia configuração do Nginx (certifique-se que este arquivo existe)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia script de inicialização (certifique-se que este arquivo existe)
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expõe porta 80 (Nginx serve tudo)
EXPOSE 80

# Health check mais tolerante para o startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
CMD ["/app/start.sh"]
