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

# Instala curl e outras dependências necessárias
RUN apk add --no-cache curl postgresql-client

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cria diretórios necessários
WORKDIR /app

# Copia frontend compilado
COPY --from=frontend-builder /app/dist ./public

# Copia backend compilado
COPY --from=backend-builder --chown=nextjs:nodejs /app ./

# Cria script de inicialização
RUN echo '#!/bin/sh\n\
echo "🚀 Starting Finanças do Lar System..."\n\
echo "📊 Environment: $NODE_ENV"\n\
echo "🔗 Port: $PORT"\n\
\n\
# Wait for database to be ready\n\
echo "⏳ Waiting for database..."\n\
until pg_isready -h postgres -p 5432 -U $POSTGRES_USER; do\n\
  echo "Database is unavailable - sleeping"\n\
  sleep 2\n\
done\n\
echo "✅ Database is ready!"\n\
\n\
# Run database migrations\n\
echo "🔄 Running database migrations..."\n\
npx prisma migrate deploy\n\
\n\
# Start the application\n\
echo "🎯 Starting application..."\n\
exec node src/server.js' > /app/start.sh

RUN chmod +x /app/start.sh

# Muda para usuário não-root
USER nextjs

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3001

# Expõe porta 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicialização
CMD ["/app/start.sh"]