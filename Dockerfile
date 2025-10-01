# ============================================
# Dockerfile simplificado para Coolify
# ============================================
FROM node:20-alpine

WORKDIR /app

# Instala todas as ferramentas necessárias de uma vez
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash \
    postgresql-client \
    netcat-openbsd \
    openssl \
    && rm -rf /var/cache/apk/*

# ============================================
# Build Frontend
# ============================================

# Copia package.json do frontend
COPY package*.json ./
RUN npm install

# Copia código do frontend
COPY tsconfig*.json vite.config.ts index.html postcss.config.js tailwind.config.js ./
COPY src ./src

# Build do frontend
RUN npm run build

# ============================================
# Setup Backend
# ============================================

# Muda para o diretório do backend
WORKDIR /app/backend

# Copia package.json e instala dependências
COPY backend/package*.json ./
RUN npm install

# Copia o schema do Prisma primeiro
COPY backend/prisma ./prisma/

# Gera Prisma Client
RUN npx prisma generate

# Copia o resto do backend
COPY backend/src ./src/
COPY backend/entrypoint.sh ./entrypoint.sh

# Move o frontend buildado para a pasta public
RUN mv /app/dist ./public

# Permissões no entrypoint
RUN chmod +x ./entrypoint.sh

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expõe porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Inicia aplicação
ENTRYPOINT ["./entrypoint.sh"]
