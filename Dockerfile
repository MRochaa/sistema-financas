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

# Instala dependências necessárias para o Prisma no Alpine
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    ca-certificates

# Copia arquivos de dependências do backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

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

# Instala dependências necessárias para produção
RUN apk add --no-cache \
    curl \
    postgresql-client \
    openssl \
    ca-certificates \
    libc6-compat

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Cria diretórios necessários
WORKDIR /app

# Copia frontend compilado
COPY --from=frontend-builder --chown=nextjs:nodejs /app/dist ./public

# Copia backend compilado
COPY --from=backend-builder --chown=nextjs:nodejs /app ./

# Cria script de inicialização
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
echo "🚀 Starting Finanças do Lar System..."
echo "📊 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"

# Wait for database to be ready
echo "⏳ Waiting for database..."
until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed database with initial data
echo "🌱 Seeding database..."
node src/seed.js || echo "⚠️ Seeding failed or already completed"

# Start the application
echo "🎯 Starting application..."
exec node src/server.js
EOF

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["/app/start.sh"]