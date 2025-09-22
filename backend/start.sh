#!/bin/bash

echo "🚀 Starting Finanças do Lar System..."
echo "📊 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"

# Função para detectar se estamos no Coolify
detect_environment() {
    if [ -n "$COOLIFY_CONTAINER_NAME" ] || [ -n "$COOLIFY_URL" ]; then
        echo "🐳 Detected Coolify environment"
        return 0
    else
        echo "💻 Detected local environment"
        return 1
    fi
}

# Função para testar conexão com o banco usando psql
test_database_connection() {
    local host="$1"
    local port="$2"
    local user="$3"
    local password="$4"
    local dbname="$5"
    
    echo "🔍 Testing connection: $user@$host:$port/$dbname"
    
    # Testar conexão com timeout usando psql
    if timeout 10 bash -c "PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d '$dbname' -c 'SELECT 1;' >/dev/null 2>&1"; then
        echo "✅ Connection successful!"
        return 0
    else
        echo "❌ Connection failed"
        return 1
    fi
}

# Função para configurar DATABASE_URL baseado no ambiente
configure_database_url() {
    if detect_environment; then
        # No Coolify, usar as variáveis de ambiente fornecidas
        local db_host="q8oo8gc4c8c4c0ccs4g800ws"  # Host interno do PostgreSQL no Coolify
        local db_port="5432"
        local db_user="${FINANCAS_POSTGRES_USER:-financas_user}"
        local db_password="${FINANCAS_POSTGRES_PASSWORD:-financas_senha_123}"
        local db_name="${FINANCAS_POSTGRES_DB:-financas_lar_db}"
        
        echo "🐳 Coolify environment detected"
        echo "🎯 Target: $db_user@$db_host:$db_port/$db_name"
        
        # Construir DATABASE_URL
        export DATABASE_URL="postgresql://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}?schema=public"
        
        echo "✅ DATABASE_URL configured for Coolify"
        echo "🔗 DATABASE_URL: $(echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')"
        
        # Aguardar um pouco para o PostgreSQL estar pronto
        echo "⏳ Waiting 10 seconds for PostgreSQL to be ready..."
        sleep 10
        
        # Testar conexão
        if test_database_connection "$db_host" "$db_port" "$db_user" "$db_password" "$db_name"; then
            echo "✅ Database connection verified"
            return 0
        else
            echo "❌ Database connection failed, but continuing..."
            return 1
        fi
    else
        # Ambiente local - usar configuração padrão
        echo "💻 Local environment - using default DATABASE_URL"
        return 0
    fi
}

# Detectar ambiente
detect_environment

# Configurar conexão com banco
echo "🔗 Configuring database connection..."
configure_database_url

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