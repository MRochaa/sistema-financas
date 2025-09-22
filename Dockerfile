# ============================================
# ESTÁGIO 1: Build do Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia arquivos de dependências do frontend
COPY package*.json ./

# Instala TODAS as dependências (incluindo dev) para o build
RUN npm install

# Copia código fonte do frontend
COPY . .

# Executa o build do frontend
RUN npm run build

# ============================================
# ESTÁGIO 2: Build do Backend
# ============================================
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copia arquivos de dependências do backend
COPY backend/package*.json ./

# Instala dependências do backend
RUN npm install

# Copia código fonte do backend
COPY backend/ ./

# Gera o Prisma Client
RUN npx prisma generate

# ============================================
# ESTÁGIO 3: Imagem Final de Produção
# ============================================
FROM node:20-alpine

# Instala curl e postgresql-client para health check e migrations
RUN apk add --no-cache curl postgresql-client

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cria diretórios necessários
WORKDIR /app

# Copia frontend compilado
COPY --from=frontend-builder /app/dist ./public

# Copia backend compilado
COPY --from=backend-builder /app ./

# Cria script de inicialização
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting Finanças do Lar System..."' >> /app/start.sh && \
    echo 'echo "📊 Environment: $NODE_ENV"' >> /app/start.sh && \
    echo 'echo "🔗 Port: $PORT"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for database to be ready' >> /app/start.sh && \
    echo 'echo "⏳ Waiting for database..."' >> /app/start.sh && \
    echo 'until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do' >> /app/start.sh && \
    echo '  echo "Database is unavailable - sleeping"' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'echo "✅ Database is ready!"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Run database migrations' >> /app/start.sh && \
    echo 'echo "🔄 Running database migrations..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Seed database with initial data' >> /app/start.sh && \
    echo 'echo "🌱 Seeding database..."' >> /app/start.sh && \
    echo 'node src/seed.js' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start the application' >> /app/start.sh && \
    echo 'echo "🎯 Starting application..."' >> /app/start.sh && \
    echo 'exec node src/server.js' >> /app/start.sh

# Define permissões e proprietário
RUN chmod +x /app/start.sh && \
    chown -R nextjs:nodejs /app

# Muda para usuário não-root
USER nextjs

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3000

# Expõe porta 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["/app/start.sh"]