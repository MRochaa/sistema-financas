#!/bin/bash

# Script de inicialização do container
# Este script inicia o backend Node.js e o Nginx para servir o frontend

echo "🚀 Iniciando Sistema Financeiro..."

# Define variáveis de ambiente padrão se não estiverem definidas
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}

# Navega para o diretório do backend
cd /app/backend

# Executa migrações do Prisma (se necessário)
echo "📊 Executando migrações do banco de dados..."
npx prisma migrate deploy 2>/dev/null || echo "⚠️ Migrações já aplicadas ou banco não disponível"

# Inicia o backend em background
echo "🔧 Iniciando servidor backend na porta $PORT..."
node server.js &

# Aguarda o backend iniciar
sleep 5

# Verifica se o backend está rodando
if curl -f http://localhost:$PORT/health 2>/dev/null; then
    echo "✅ Backend iniciado com sucesso!"
else
    echo "⚠️ Backend ainda iniciando..."
fi

# Inicia o Nginx em foreground
echo "🌐 Iniciando servidor Nginx..."
nginx -g 'daemon off;'
