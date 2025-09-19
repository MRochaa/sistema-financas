#!/bin/bash
# Script de inicialização que roda migrations e inicia a aplicação

set -e  # Para o script se houver erro

echo "🚀 Iniciando Sistema Finanças..."
echo "========================================="

# Função para verificar conexão com banco
check_database() {
    echo "📊 Verificando conexão com banco de dados..."
    
    # Tenta conectar até 30 vezes (30 segundos)
    for i in $(seq 1 30); do
        if npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT 1" > /dev/null 2>&1; then
            echo "✅ Banco de dados conectado!"
            return 0
        fi
        echo "⏳ Aguardando banco de dados... tentativa $i/30"
        sleep 1
    done
    
    echo "❌ Falha ao conectar no banco de dados após 30 tentativas"
    return 1
}

# Verifica se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRO CRÍTICO: DATABASE_URL não está configurada!"
    echo "Configure a variável DATABASE_URL no painel do Coolify:"
    echo "Exemplo: postgresql://usuario:senha@host:5432/database"
    echo "========================================="
    exit 1
fi

echo "✅ DATABASE_URL encontrada"

# Aguarda o banco de dados estar pronto
check_database || exit 1

# Executa migrations do Prisma
echo "📦 Executando migrations do banco de dados..."
if npx prisma migrate deploy; then
    echo "✅ Migrations executadas com sucesso!"
else
    echo "⚠️  Aviso: Falha ao executar migrations"
    echo "Tentando continuar mesmo assim..."
fi

# Gera o cliente Prisma (por garantia)
echo "🔧 Verificando cliente Prisma..."
npx prisma generate

echo "========================================="
echo "✨ Iniciando aplicação na porta $PORT..."
echo "========================================="

# Inicia a aplicação
# Para Next.js:
exec npm start
# Para Node.js/Express com PM2:
# exec npx pm2-runtime start ecosystem.config.js
# Para Node.js puro:
# exec node index.js
