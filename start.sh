#!/bin/bash

# Script de inicialização do container
echo "=== Iniciando Sistema de Finanças ==="
echo "Timestamp: $(date)"

# Configuração do ambiente
echo "NODE_ENV: ${NODE_ENV:-production}"
echo "BACKEND_PORT: ${BACKEND_PORT:-3001}"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."

# Inicia o backend Node.js
cd /app/backend
echo "Iniciando backend na porta ${BACKEND_PORT:-3001}..."
node src/server.js &
BACKEND_PID=$!

# Aguarda o backend iniciar
echo "Aguardando backend iniciar..."
sleep 5

# Verifica se o backend está rodando
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend iniciado com sucesso (PID: $BACKEND_PID)"
else
    echo "❌ Falha ao iniciar o backend"
    exit 1
fi

# Inicia o Nginx em foreground
echo "Iniciando Nginx na porta 3000..."
nginx -g "daemon off;"
