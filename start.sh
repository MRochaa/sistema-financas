#!/bin/sh
# Script de inicialização da aplicação com verificações de segurança

echo "🚀 Iniciando aplicação Sistema Finanças..."

# Verifica se a DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRO: DATABASE_URL não está configurada!"
    echo "Configure a variável de ambiente DATABASE_URL no Coolify"
    exit 1
fi

echo "✅ DATABASE_URL configurada"

# Executa as migrations do Prisma
echo "📦 Executando migrations do banco de dados..."
npx prisma migrate deploy

# Gera o cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Inicia a aplicação
echo "✨ Iniciando servidor..."
npm start
