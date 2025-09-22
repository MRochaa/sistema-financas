#!/bin/bash

echo "🚀 Starting Finanças do Lar System..."
echo "📊 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"

# Configurar DATABASE_URL baseado nas variáveis do Coolify
if [ -n "$FINANCAS_POSTGRES_DB" ] && [ -n "$FINANCAS_POSTGRES_USER" ] && [ -n "$FINANCAS_POSTGRES_PASSWORD" ]; then
    # Detectar se estamos no Coolify (procurar por serviços com nomes específicos)
    if nslookup postgres >/dev/null 2>&1; then
        # Estamos no Coolify, usar nome do serviço PostgreSQL
        export DATABASE_URL="postgresql://${FINANCAS_POSTGRES_USER}:${FINANCAS_POSTGRES_PASSWORD}@postgres:5432/${FINANCAS_POSTGRES_DB}?schema=public"
        echo "🗄️ Database URL configured for Coolify"
    else
        # Fallback para localhost
        export DATABASE_URL="postgresql://${FINANCAS_POSTGRES_USER}:${FINANCAS_POSTGRES_PASSWORD}@localhost:5432/${FINANCAS_POSTGRES_DB}?schema=public"
        echo "🗄️ Database URL configured for localhost"
    fi
    echo "🗄️ Database: $FINANCAS_POSTGRES_DB"
    echo "👤 User: $FINANCAS_POSTGRES_USER"
fi

echo "🔗 DATABASE_URL: ${DATABASE_URL}"

# Aguardar um pouco para o banco estar pronto
echo "⏳ Waiting 15 seconds for database to be ready..."
sleep 15

# Tentar conectar ao banco várias vezes
echo "🔐 Testing database connection..."
RETRY_COUNT=0
MAX_RETRIES=30

# Extrair componentes da DATABASE_URL para teste de conexão
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "🔍 Connection details:"
echo "  - Host: $DB_HOST"
echo "  - Port: $DB_PORT"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"

# Função para testar conexão
test_connection() {
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1
}

# Loop de tentativas de conexão
until test_connection; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Database connection failed after $MAX_RETRIES attempts"
    echo "🔄 Trying to connect to default postgres database and create target database..."
    
    # Tentar conectar ao banco padrão e criar o banco se necessário
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
      echo "✅ Connected to default database, creating target database if it doesn't exist..."
      PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null || echo "Database may already exist"
      
      # Tentar novamente com o banco criado
      if test_connection; then
        echo "✅ Successfully connected to created database!"
        break
      fi
    fi
    
    echo "❌ Cannot connect to PostgreSQL. Starting application anyway..."
    break
  else
    echo "Database connection failed - retrying in 5 seconds... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
  fi
done

if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
  echo "✅ Database connection successful!"
  
  # Executar migrações
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy || {
    echo "⚠️ Migration failed, trying to push schema..."
    npx prisma db push --accept-data-loss || {
      echo "⚠️ Schema push also failed, but continuing..."
    }
  }

  # Gerar cliente Prisma
  echo "🔧 Generating Prisma client..."
  npx prisma generate || {
    echo "⚠️ Prisma generate failed, but continuing..."
  }

  # Seed do banco
  echo "🌱 Seeding database..."
  node src/seed.js || {
    echo "⚠️ Seeding failed or already completed"
  }
else
  echo "⚠️ Starting without database connection"
fi

# Iniciar aplicação
echo "🎯 Starting application on port $PORT..."
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔒 JWT configured: $([ -n "$JWT_SECRET" ] && echo "Yes" || echo "No")"

exec node src/server.js