#!/bin/bash

# Script de inicialização do container
# Gerencia o startup do backend Node.js e frontend Nginx

echo "=== Iniciando Sistema de Finanças ==="
echo "Ambiente: $NODE_ENV"
echo "Porta Backend: $PORT"

# Função para verificar se o backend está pronto (não falha em HTTP 503)
check_backend() {
    curl -s http://localhost:${PORT:-3001}/api/health > /dev/null 2>&1
    return $?
}

cd /app/backend

# Inicia o servidor Node.js primeiro (em background)
echo "Iniciando backend na porta ${PORT:-3001}..."
PORT=${PORT:-3001} node src/server.js &
BACKEND_PID=$!

# Inicia o Nginx imediatamente (para satisfazer o healthcheck /health)
echo "Iniciando Nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Executa migrações do Prisma de forma não bloqueante (se DATABASE_URL estiver definido)
if [ -n "${DATABASE_URL}" ]; then
    echo "Executando migrações do Prisma em background..."
    (
        set -e
        # timeout suave: encerra após 45s se travar
        START_TS=$(date +%s)
        echo "Iniciando prisma migrate deploy..."
        npx prisma migrate deploy || echo "Aviso: migrações falharam (continuando)."
        END_TS=$(date +%s)
        echo "Migrações finalizadas em $((END_TS-START_TS))s"
    ) &
else
    echo "DATABASE_URL não definido; pulando migrações do Prisma."
fi

# Aguarda o backend iniciar (sem derrubar o container se demorar)
echo "Aguardando backend iniciar (até 60s, sem abortar)..."
WAIT_TIME=0
MAX_WAIT=60
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if check_backend; then
        echo "✅ Backend respondeu ao healthcheck!"
        break
    fi
    echo "Aguardando backend... ($WAIT_TIME/$MAX_WAIT)"
    sleep 3
    WAIT_TIME=$((WAIT_TIME + 3))
done
if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "⚠️  Aviso: Backend não respondeu dentro do tempo esperado, continuando assim mesmo."
fi

# Função para tratar sinais de término
cleanup() {
    echo "Encerrando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $NGINX_PID 2>/dev/null
    exit 0
}

# Configura tratamento de sinais
trap cleanup SIGTERM SIGINT

# Mantém o script rodando e monitora os processos
while true; do
    # Verifica se o backend ainda está rodando
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend parou inesperadamente"
        cleanup
    fi
    
    # Verifica se o nginx ainda está rodando  
    if ! kill -0 $NGINX_PID 2>/dev/null; then
        echo "❌ Nginx parou inesperadamente"
        cleanup
    fi
    
    sleep 5
done
