# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia package.json do frontend
COPY frontend/package*.json ./frontend/

# Instala todas as dependências do frontend
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

# Instala dependências necessárias para Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copia package.json do backend
COPY backend/package*.json ./

# Instala todas as dependências
RUN npm install

# Copia código do backend
COPY backend/ ./

# Gera Prisma client
RUN npx prisma generate

# Remove devDependencies
RUN npm prune --production

# ============================================
# ESTÁGIO 3: Imagem Final de Produção
# ============================================
FROM node:20-alpine

# Instala nginx e ferramentas necessárias
RUN apk add --no-cache nginx bash curl && \
    rm -rf /var/cache/apk/*

# Cria diretórios necessários
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run /usr/share/nginx/html

# Copia backend compilado
COPY --from=backend-builder /app /app/backend

# Copia frontend compilado
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copia arquivos de configuração
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh /start.sh

# Torna o script executável
RUN chmod +x /start.sh

# Variáveis de ambiente
ENV NODE_ENV=production \
    PORT=3001

# Expõe porta 80
EXPOSE 80

# Health check mais simples
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
CMD ["/start.sh"]
