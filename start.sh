#!/bin/bash

echo "=== Iniciando Sistema de Finanças ==="

# Configurar variáveis
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}
export DATABASE_URL=${DATABASE_URL}
export JWT_SECRET=${JWT_SECRET}

# Verificar estrutura do backend
echo "Verificando estrutura do backend..."
ls -la /app/backend/

# Encontrar o arquivo principal do servidor
if [ -f "/app/backend/src/server.js" ]; then
    SERVER_FILE="/app/backend/src/server.js"
elif [ -f "/app/backend/server.js" ]; then
    SERVER_FILE="/app/backend/server.js"
elif [ -f "/app/backend/src/index.js" ]; then
    SERVER_FILE="/app/backend/src/index.js"
elif [ -f "/app/backend/index.js" ]; then
    SERVER_FILE="/app/backend/index.js"
else
    echo "ERRO: Arquivo do servidor não encontrado!"
    echo "Conteúdo do diretório backend:"
    find /app/backend -name "*.js" -type f
    exit 1
fi

echo "Arquivo do servidor encontrado: $SERVER_FILE"

# Iniciar backend
echo "Iniciando backend na porta $PORT..."
cd /app/backend
node $SERVER_FILE &
BACKEND_PID=$!

# Aguardar backend iniciar
echo "Aguardando backend iniciar..."
sleep 5

# Verificar se o backend está rodando
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERRO: Backend falhou ao iniciar!"
    echo "Tentando ver logs de erro..."
    node $SERVER_FILE
    exit 1
fi

# Testar se o backend está respondendo
echo "Testando backend..."
curl -f http://localhost:$PORT/api/health || echo "Aviso: Backend pode não ter endpoint /api/health"

# Verificar frontend
echo "Verificando frontend..."
ls -la /usr/share/nginx/html/

# Iniciar nginx
echo "Iniciando Nginx..."
nginx -g "daemon off;"
