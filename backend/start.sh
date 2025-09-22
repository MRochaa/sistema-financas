#!/bin/bash

echo "🚀 Starting Finanças do Lar System..."
echo "📊 Environment: $NODE_ENV"
echo "🔗 Port: $PORT"

# Função para detectar se estamos no Coolify
detect_environment() {
    if [ -n "$COOLIFY_CONTAINER_NAME" ] || [ -n "$COOLIFY_URL" ]; then
        echo "🐳 Detected Coolify environment"
        return 0
    elif nslookup postgres >/dev/null 2>&1; then
        echo "🐳 Detected Docker Compose environment"
        return 0
    else
        echo "💻 Detected local environment"
        return 1
    fi
}

# Configurar DATABASE_URL baseado no ambiente
configure_database_url() {
    # Tentar diferentes combinações de credenciais
    local db_hosts=("postgres" "localhost")
    local db_users=("$FINANCAS_POSTGRES_USER" "postgres" "financas_user")
    local db_passwords=("$FINANCAS_POSTGRES_PASSWORD" "postgres" "financas_senha_123")
    local db_names=("$FINANCAS_POSTGRES_DB" "postgres" "financas_lar_db")
    local db_port="5432"
    
    echo "🔍 Testing database connections..."
    
    # Se já temos DATABASE_URL configurada, testar primeiro
    if [ -n "$DATABASE_URL" ]; then
        echo "🔗 Testing existing DATABASE_URL..."
        if test_database_connection "$DATABASE_URL"; then
            echo "✅ Existing DATABASE_URL works!"
            return 0
        fi
    fi
    
    # Tentar diferentes combinações
    for host in "${db_hosts[@]}"; do
        for user in "${db_users[@]}"; do
            for password in "${db_passwords[@]}"; do
                for dbname in "${db_names[@]}"; do
                    if [ -n "$user" ] && [ -n "$password" ] && [ -n "$dbname" ]; then
                        local test_url="postgresql://${user}:${password}@${host}:${db_port}/${dbname}?schema=public"
                        echo "🔍 Testing: postgresql://${user}:***@${host}:${db_port}/${dbname}"
                        
                        if test_database_connection "$test_url"; then
                            export DATABASE_URL="$test_url"
                            echo "✅ Found working connection!"
                            echo "👤 User: $user"
                            echo "🗄️ Database: $dbname"
                            echo "🏠 Host: $host"
                            return 0
                        fi
                    fi
                done
            done
        done
    done
    
    echo "❌ No working database connection found"
    return 1
}

# Função para testar conexão com o banco
test_database_connection() {
    local url="$1"
    
    # Extrair componentes da URL
    local user=$(echo "$url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    local password=$(echo "$url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    local host=$(echo "$url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local port=$(echo "$url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local dbname=$(echo "$url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    # Testar conexão com timeout
    if timeout 10 bash -c "PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d '$dbname' -c 'SELECT 1;' >/dev/null 2>&1"; then
        return 0
    else
        return 1
    fi
}

# Função para criar banco se necessário
create_database_if_needed() {
    local user=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    local password=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    local host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local dbname=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    echo "🔧 Ensuring database '$dbname' exists..."
    
    # Tentar conectar ao banco específico
    if PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$dbname" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database '$dbname' exists and is accessible"
        return 0
    fi
    
    # Se não conseguir, tentar conectar ao postgres padrão e criar o banco
    echo "🔧 Database '$dbname' not found, trying to create..."
    if PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "postgres" -c "CREATE DATABASE \"$dbname\";" 2>/dev/null; then
        echo "✅ Database '$dbname' created successfully"
        return 0
    else
        echo "⚠️ Could not create database '$dbname', but continuing..."
        return 1
    fi
}

# Detectar ambiente
detect_environment

# Configurar conexão com banco
echo "🔗 Configuring database connection..."
if configure_database_url; then
    echo "✅ Database connection configured"
    echo "🔗 DATABASE_URL: $(echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')"
    
    # Aguardar um pouco para estabilizar
    echo "⏳ Waiting 10 seconds for database to stabilize..."
    sleep 10
    
    # Criar banco se necessário
    create_database_if_needed
    
    # Executar migrações
    echo "🔄 Running database migrations..."
    if npx prisma migrate deploy 2>/dev/null; then
        echo "✅ Migrations completed successfully"
    else
        echo "⚠️ Migrations failed, trying to push schema..."
        if npx prisma db push --accept-data-loss 2>/dev/null; then
            echo "✅ Schema pushed successfully"
        else
            echo "⚠️ Schema push failed, but continuing..."
        fi
    fi
    
    # Gerar cliente Prisma
    echo "🔧 Generating Prisma client..."
    npx prisma generate || echo "⚠️ Prisma generate failed, but continuing..."
    
    # Seed do banco
    echo "🌱 Seeding database..."
    node src/seed.js || echo "⚠️ Seeding failed or already completed"
    
else
    echo "❌ Could not configure database connection"
    echo "🔄 Starting application without database (will retry connections)"
fi

# Iniciar aplicação
echo "🎯 Starting application on port $PORT..."
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔒 JWT configured: $([ -n "$JWT_SECRET" ] && echo "Yes" || echo "No")"

exec node src/server.js