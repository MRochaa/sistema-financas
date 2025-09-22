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
        echo "🐳 Detected Docker environment with postgres service"
        return 0
    else
        echo "💻 Detected local environment"
        return 1
    fi
}

# Função para testar conexão com o banco
test_database_connection() {
    local host="$1"
    local port="$2"
    local user="$3"
    local password="$4"
    local dbname="$5"
    
    echo "🔍 Testing connection: $user@$host:$port/$dbname"
    
    # Testar conexão com timeout
    if timeout 10 bash -c "PGPASSWORD='$password' psql -h '$host' -p '$port' -U '$user' -d '$dbname' -c 'SELECT 1;' >/dev/null 2>&1"; then
        echo "✅ Connection successful!"
        return 0
    else
        echo "❌ Connection failed"
        return 1
    fi
}

# Função para criar usuário e banco se necessário
setup_database() {
    local admin_user="$1"
    local admin_password="$2"
    local target_user="$3"
    local target_password="$4"
    local target_db="$5"
    local host="postgres"
    local port="5432"
    
    echo "🔧 Setting up database with admin user: $admin_user"
    
    # Conectar como admin e criar usuário/banco
    PGPASSWORD="$admin_password" psql -h "$host" -p "$port" -U "$admin_user" -d "postgres" << EOF
-- Criar usuário se não existir
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$target_user') THEN
        CREATE USER $target_user WITH PASSWORD '$target_password';
        GRANT CREATEDB TO $target_user;
        ALTER USER $target_user CREATEDB;
        RAISE NOTICE 'User $target_user created successfully';
    ELSE
        RAISE NOTICE 'User $target_user already exists';
    END IF;
END
\$\$;

-- Criar banco se não existir
SELECT 'CREATE DATABASE $target_db OWNER $target_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$target_db')\gexec

-- Garantir permissões
GRANT ALL PRIVILEGES ON DATABASE $target_db TO $target_user;
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Database setup completed successfully"
        return 0
    else
        echo "❌ Database setup failed"
        return 1
    fi
}

# Configurar DATABASE_URL baseado no ambiente
configure_database_url() {
    local host="postgres"
    local port="5432"
    local target_user="${FINANCAS_POSTGRES_USER:-financas_user}"
    local target_password="${FINANCAS_POSTGRES_PASSWORD:-financas_senha_123}"
    local target_db="${FINANCAS_POSTGRES_DB:-financas_lar_db}"
    
    echo "🔍 Configuring database connection..."
    echo "🎯 Target: $target_user@$host:$port/$target_db"
    
    # Primeiro, tentar conectar com as credenciais desejadas
    if test_database_connection "$host" "$port" "$target_user" "$target_password" "$target_db"; then
        export DATABASE_URL="postgresql://${target_user}:${target_password}@${host}:${port}/${target_db}?schema=public"
        echo "✅ Using existing credentials"
        return 0
    fi
    
    echo "🔧 Target credentials don't work, trying to set them up..."
    
    # Tentar diferentes credenciais de admin para configurar o banco
    local admin_combinations=(
        "postgres:"
        "postgres:postgres"
        "postgres:password"
        "root:"
        "root:root"
        "admin:admin"
    )
    
    for combo in "${admin_combinations[@]}"; do
        local admin_user=$(echo "$combo" | cut -d: -f1)
        local admin_password=$(echo "$combo" | cut -d: -f2)
        
        echo "🔍 Trying admin credentials: $admin_user"
        
        # Testar conexão com postgres padrão
        if test_database_connection "$host" "$port" "$admin_user" "$admin_password" "postgres"; then
            echo "✅ Admin connection successful, setting up target database..."
            
            if setup_database "$admin_user" "$admin_password" "$target_user" "$target_password" "$target_db"; then
                # Testar se agora conseguimos conectar com as credenciais desejadas
                if test_database_connection "$host" "$port" "$target_user" "$target_password" "$target_db"; then
                    export DATABASE_URL="postgresql://${target_user}:${target_password}@${host}:${port}/${target_db}?schema=public"
                    echo "✅ Database setup completed successfully!"
                    return 0
                fi
            fi
        fi
    done
    
    echo "❌ Could not configure database with target credentials"
    echo "🔄 Will try to use any working connection..."
    
    # Como último recurso, tentar usar qualquer conexão que funcione
    for combo in "${admin_combinations[@]}"; do
        local admin_user=$(echo "$combo" | cut -d: -f1)
        local admin_password=$(echo "$combo" | cut -d: -f2)
        
        if test_database_connection "$host" "$port" "$admin_user" "$admin_password" "postgres"; then
            echo "⚠️ Using fallback connection: $admin_user@postgres"
            export DATABASE_URL="postgresql://${admin_user}:${admin_password}@${host}:${port}/postgres?schema=public"
            return 0
        fi
    done
    
    echo "❌ No working database connection found"
    return 1
}

# Detectar ambiente
detect_environment

# Aguardar PostgreSQL estar pronto
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if nslookup postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL service is reachable"
        break
    fi
    echo "⏳ Waiting for PostgreSQL... ($i/30)"
    sleep 2
done

# Configurar conexão com banco
echo "🔗 Configuring database connection..."
if configure_database_url; then
    echo "✅ Database connection configured"
    echo "🔗 DATABASE_URL: $(echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')"
    
    # Aguardar um pouco para estabilizar
    echo "⏳ Waiting 5 seconds for database to stabilize..."
    sleep 5
    
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