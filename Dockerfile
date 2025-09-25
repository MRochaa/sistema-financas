# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia arquivos de dependências do frontend (raiz do projeto)
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Instala TODAS as dependências (incluindo dev) para o build
RUN npm install

# Copia código fonte do frontend
COPY src/ ./src/
COPY index.html ./

# Executa o build do frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:20-alpine AS backend-builder

# Instala dependências do sistema necessárias para Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copia arquivos de dependências do backend
COPY backend/package*.json ./

# Instala todas as dependências
RUN npm install

# Copia código fonte do backend
COPY backend/ ./

# Gera o Prisma Client com os targets binários corretos
RUN npx prisma generate

# Remove devDependencies mantendo apenas produção
RUN npm prune --production

# ============================================
# ESTÁGIO 3: Imagem Final de Produção
# ============================================
FROM node:20-alpine

# Instala nginx, openssl e ferramentas necessárias
RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    openssl \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Cria diretórios necessários com permissões corretas
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run/nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/log/nginx /var/cache/nginx /var/run/nginx

# Copia backend compilado com node_modules e prisma client gerado
COPY --from=backend-builder /app /app/backend

# Copia frontend compilado (apenas os arquivos estáticos gerados)
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
# Copia arquivos públicos (favicon, etc.)
COPY public/ /tmp/public/
RUN if [ -f /tmp/public/favicon.svg ]; then cp /tmp/public/favicon.svg /usr/share/nginx/html/favicon.svg; fi

# Copia arquivos de configuração
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh /start.sh
COPY debug.sh /debug.sh
COPY teste-nginx.sh /teste-nginx.sh

# Ajusta permissões dos scripts
RUN chmod +x /start.sh /debug.sh /teste-nginx.sh

# Debug - verificar estrutura após build
RUN echo "Verificando estrutura após build:" && \
    ls -la /app/backend/ && \
    ls -la /usr/share/nginx/html/ && \
    ls -la /etc/nginx/http.d/

# Define diretório de trabalho
WORKDIR /app/backend

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3001

# Expõe porta 80 para nginx
EXPOSE 80

# Health check que verifica se nginx está respondendo
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
# TEMPORÁRIO: Use teste-nginx.sh para debug
# CMD ["/teste-nginx.sh"]
# Depois volte para:
CMD ["/start.sh"]
