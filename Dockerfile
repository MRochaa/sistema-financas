# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia arquivos de dependências do frontend (pasta frontend/)
COPY frontend/package*.json ./frontend/

# Instala TODAS as dependências (incluindo dev) para o build
WORKDIR /app/frontend
RUN npm install

# Copia código fonte do frontend (pasta frontend/)
WORKDIR /app
COPY frontend/ ./frontend/

# Executa o build do frontend (vite em /app/frontend)
WORKDIR /app/frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN VITE_API_URL=${VITE_API_URL} npm run build

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:20-alpine AS backend-builder

# Instala dependências do sistema necessárias para Prisma
# Otimizado com timeout e retry para evitar travamentos
RUN apk update --no-cache && \
    apk add --no-cache --timeout=300 \
    openssl \
    libc6-compat \
    && rm -rf /var/cache/apk/* /tmp/*

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
# Otimizado com timeout e limpeza para evitar travamentos
RUN apk update --no-cache && \
    apk add --no-cache --timeout=300 \
    nginx \
    bash \
    curl \
    openssl \
    libc6-compat \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Cria diretórios necessários com permissões corretas
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run/nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/log/nginx /var/cache/nginx /var/run/nginx

# Copia backend compilado com node_modules e prisma client gerado
COPY --from=backend-builder /app /app/backend

# Copia frontend compilado da pasta frontend/
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copia arquivos de configuração
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY start.sh /start.sh
COPY debug-container.sh /debug-container.sh

# Ajusta permissões dos scripts
RUN chmod +x /start.sh /debug-container.sh

# Define diretório de trabalho
WORKDIR /app/backend

# Variáveis de ambiente padrão
ENV NODE_ENV=production

# Build args para controle de comportamento
ARG BUILD_TIMEOUT=300
ARG APK_TIMEOUT=300

# Expõe porta 3000 (Nginx)
EXPOSE 3000

# Health check que verifica se nginx está respondendo (porta 3000)
# Usa timeout mais agressivo e menos retries para falhar mais rápido
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["/start.sh"]
