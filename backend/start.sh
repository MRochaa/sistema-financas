#!/bin/bash

echo "🚀 Starting Finanças do Lar System..."
echo "📊 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"

# Configurar DATABASE_URL usando as variáveis do Coolify
if [ -n "$FINANCAS_POSTGRES_USER" ] && [ -n "$FINANCAS_POSTGRES_PASSWORD" ] && [ -n "$FINANCAS_POSTGRES_DB" ]; then
    # Usar host interno do PostgreSQL do Coolify
    export DATABASE_URL="postgresql://${FINANCAS_POSTGRES_USER}:${FINANCAS_POSTGRES_PASSWORD}@q8oo8gc4c8c4c0ccs4g800ws:5432/${FINANCAS_POSTGRES_DB}?schema=public"
    echo "✅ DATABASE_URL configured from Coolify variables"
    echo "🔗 Host: q8oo8gc4c8c4c0ccs4g800ws:5432"
    echo "👤 User: $FINANCAS_POSTGRES_USER"
    echo "🗄️ Database: $FINANCAS_POSTGRES_DB"
else
    echo "⚠️ Using default DATABASE_URL from environment"
fi

# Aguardar PostgreSQL estar pronto (máximo 30 segundos)
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..6}; do
    if PGPASSWORD="$FINANCAS_POSTGRES_PASSWORD" psql -h "q8oo8gc4c8c4c0ccs4g800ws" -p 5432 -U "$FINANCAS_POSTGRES_USER" -d "$FINANCAS_POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    else
        echo "⏳ Attempt $i/6: PostgreSQL not ready yet, waiting 5 seconds..."
        sleep 5
    fi
    
    if [ $i -eq 6 ]; then
        echo "⚠️ PostgreSQL not ready after 30 seconds, but continuing..."
    fi
done

# Executar migrações com timeout
echo "🔄 Running database migrations..."
timeout 30 npx prisma migrate deploy 2>/dev/null && echo "✅ Migrations completed successfully" || echo "⚠️ Migrations failed or timed out"

# Gerar cliente Prisma
echo "🔧 Generating Prisma client..."
timeout 15 npx prisma generate >/dev/null 2>&1 && echo "✅ Prisma client generated" || echo "⚠️ Prisma generate failed"

# Seed do banco (com timeout)
echo "🌱 Seeding database..."
timeout 20 node src/seed.js 2>/dev/null && echo "✅ Database seeded" || echo "⚠️ Seeding failed or already completed"

# Verificar se o servidor pode iniciar
echo "🔍 Pre-flight checks..."
if [ ! -f "src/server.js" ]; then
    echo "❌ server.js not found!"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found!"
    exit 1
fi

# Iniciar aplicação
echo "🎯 Starting application on port $PORT..."
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔒 JWT configured: $([ -n "$JWT_SECRET" ] && echo "Yes" || echo "No")"

# Usar exec para substituir o processo bash pelo node
exec node src/server.js