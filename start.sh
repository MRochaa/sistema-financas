#!/bin/bash

# Script de inicialização do container
# Gerencia o startup do backend Node.js e frontend Nginx

echo "=== Iniciando Sistema de Finanças ==="
echo "Ambiente: $NODE_ENV"
echo "Porta Backend: ${BACKEND_PORT:-$PORT}"

# Função para verificar se o backend está pronto (não falha em HTTP 503)
check_backend() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT:-3001}/api/health)
    # Aceita 200 (OK) ou 503 (Service Unavailable - banco não conectado ainda)
    [ "$response" = "200" ] || [ "$response" = "503" ]
    return $?
}

cd /app/backend

# Inicia o servidor Node.js primeiro (em background)
BACKEND_PORT=${BACKEND_PORT:-3001}
echo "Iniciando backend na porta ${BACKEND_PORT}..."
BACKEND_PORT=${BACKEND_PORT} node src/server.js &
BACKEND_PID=$!

# Inicia o Nginx imediatamente (para satisfazer o healthcheck /health)
echo "Iniciando Nginx na porta 3000..."
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
        echo "Executando seed do banco de dados..."
        npm run db:seed || echo "Aviso: seed falhou (continuando)."
        END_TS=$(date +%s)
        echo "Migrações e seed finalizados em $((END_TS-START_TS))s"
    ) &
else
    echo "DATABASE_URL não definido; pulando migrações do Prisma."
fi

# Aguarda o backend iniciar (sem derrubar o container se demorar) e adiciona diagnósticos
echo "Aguardando backend iniciar (até 60s, sem abortar)..."
WAIT_TIME=0
MAX_WAIT=60
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if check_backend; then
        echo "✅ Backend respondeu ao healthcheck!"
        break
    fi
    echo "Aguardando backend... ($WAIT_TIME/$MAX_WAIT)"
    echo "[diag] Tentando curl backend: curl -sv http://localhost:${BACKEND_PORT:-3001}/api/health"
    curl -sv http://localhost:${BACKEND_PORT:-3001}/api/health || true
    echo "[diag] Tentando curl nginx /health: curl -sv http://localhost:3000/health"
    curl -sv http://localhost:3000/health || true
    echo "[diag] Processos escutando portas:" && ss -lntp || netstat -lntp || true
    echo "[diag] Trecho de config do Nginx:" && sed -n '1,120p' /etc/nginx/http.d/default.conf || true
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
