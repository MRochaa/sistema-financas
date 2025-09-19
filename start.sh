#!/bin/bash

echo "🚀 Iniciando Sistema Finanças..."

# Inicia o backend em background
cd /app/backend

# Executa migrations
echo "📦 Executando migrations..."
npx prisma migrate deploy || echo "⚠️  Migrations já aplicadas ou erro"

# Gera cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Inicia o backend
echo "🎯 Iniciando backend na porta 3001..."
node src/server.js &

# Aguarda o backend iniciar
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Verifica se backend está rodando
until curl -f http://localhost:3001/health > /dev/null 2>&1; do
    echo "⏳ Backend ainda iniciando..."
    sleep 2
done

echo "✅ Backend rodando!"

# Inicia o Nginx em foreground
echo "🌐 Iniciando Nginx..."
nginx -g 'daemon off;'
