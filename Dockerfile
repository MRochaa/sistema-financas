# ============================================
# Dockerfile para Coolify com SQLite
# ============================================
FROM node:20-alpine

# Instala dependências necessárias para better-sqlite3
RUN apk add --no-cache \
    curl \
    bash \
    python3 \
    make \
    g++

WORKDIR /app

# ============================================
# Build Frontend
# ============================================
# FORCE REBUILD - Change this number: 91728364
ARG CACHE_BUST=91728364

COPY package*.json ./
RUN npm install

COPY eslint.config.js tsconfig*.json vite.config.ts index.html postcss.config.js tailwind.config.js ./
COPY src ./src

# Force frontend rebuild by changing build timestamp
RUN echo "<!-- Build: $(date -u +%Y%m%d-%H%M%S) -->" >> index.html

RUN npm run build

# ============================================
# Setup Backend
# ============================================
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend/src ./src/
COPY backend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Move frontend para public (força limpeza primeiro)
RUN rm -rf ./public && mv /app/dist ./public && \
    echo "=== BUILD VERIFICATION ===" && \
    ls -lh ./public/assets/*.js && \
    echo "========================="

# Configuração
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Inicia
ENTRYPOINT ["./entrypoint.sh"]
