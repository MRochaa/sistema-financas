#!/bin/bash

# ============================================
# Script de inicialização do container Docker
# Sistema de Finanças Familiares
# ============================================

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
# CORREÇÃO: Usar o caminho correto src/server.js
node src/server.js &

# Aguarda o backend iniciar (aumentando tempo para garantir)
echo "⏳ Aguardando backend inicializar..."
sleep 10

# Verifica se o backend está rodando
MAX_ATTEMPTS=10
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -f http://localhost:$PORT/health 2>/dev/null; then
        echo "✅ Backend iniciado com sucesso!"
        break
    else
        echo "⚠️ Tentativa $((ATTEMPT+1)) de $MAX_ATTEMPTS - Backend ainda iniciando..."
        sleep 2
    fi
    ATTEMPT=$((ATTEMPT+1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Backend falhou ao iniciar após $MAX_ATTEMPTS tentativas"
    echo "📋 Logs do backend:"
    # Mostra logs para debug se houver falha
    tail -n 50 /var/log/backend.log 2>/dev/null || echo "Sem logs disponíveis"
fi

# Inicia o Nginx em foreground
echo "🌐 Iniciando servidor Nginx..."
nginx -g 'daemon off;'
