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

# Aguardar PostgreSQL estar pronto (máximo 60 segundos)
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..12}; do
    if PGPASSWORD="$FINANCAS_POSTGRES_PASSWORD" psql -h "q8oo8gc4c8c4c0ccs4g800ws" -p 5432 -U "$FINANCAS_POSTGRES_USER" -d "$FINANCAS_POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    else
        echo "⏳ Attempt $i/12: PostgreSQL not ready yet, waiting 5 seconds..."
        sleep 5
    fi
    
    if [ $i -eq 12 ]; then
        echo "⚠️ PostgreSQL not ready after 60 seconds, but continuing..."
    fi
done

# Executar migrações
echo "🔄 Running database migrations..."
if npx prisma migrate deploy 2>/dev/null; then
    echo "✅ Migrations completed successfully"
elif npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "✅ Schema pushed successfully"
else
    echo "⚠️ Database setup failed, but continuing..."
fi

# Gerar cliente Prisma
echo "🔧 Generating Prisma client..."
npx prisma generate || echo "⚠️ Prisma generate failed, but continuing..."

# Seed do banco
echo "🌱 Seeding database..."
node src/seed.js || echo "⚠️ Seeding failed or already completed"

# Iniciar aplicação
echo "🎯 Starting application on port $PORT..."
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔒 JWT configured: $([ -n "$JWT_SECRET" ] && echo "Yes" || echo "No")"

exec node src/server.js